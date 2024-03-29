// firestore.js
// Wrappers on top of firestore javascript sdk

import {
    getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc,
    onSnapshot, deleteDoc
} from 'https://www.gstatic.com/firebasejs/9.3.0/firebase-firestore.js';

import { firebaseApp } from './init.js'

/**
 * Class representing a firestore document reference data
 * */
class FirestoreDocRef {

    /**
     * Constructor
     * @param {any} docRef
     * Document Reference object obtained from firestore add document api
     * We extract below values from this object.
     * @type {string} docId
     * @type {string} docPath
     * @type {FirestoreDocRef} parentDocRef
     */
    constructor(docRef) {

        this.docId = docRef.id;
        this.docPath = docRef.path;
        this.parentDocRef = {};

        // Populate optional fields
        if (docRef.parent) {
            this.parentDocRef = new FirestoreDocRef(docRef.parent);
        }
    }
}

/**
 * Class representing complete firestore document including user defined
 * unknown fields, and the firstore document reference object.
 * This class maps to the IFirestoreDocument in C# layer.
 * */
class FirestoreDocument {

    /**
     * Constructor
     * @param {any} params
     * Parameters that can be passed to this constructor.
     * Might contain one or more of below:
     * @type {any} interopObject
     * Interop Document object which contains the document reference object along
     * with user defined fields.
     * This is the document coming in from C# interop layer.
     * @type {FirestoreDocRef} docRef
     * @type {any} userDocument
     */
    constructor(params) {

        this.docRef = {};
        this.userDocument = {};

        if (params.interopObject) {
            const { DocRef, ...userDocument } = params.interopObject;
            if (DocRef) {
                this.docRef = new FirestoreDocRef(DocRef);
            }
            if (userDocument) {
                this.userDocument = userDocument;
            }
        }
        if (params.docRef) {
            this.docRef = params.docRef;
        }
        if (params.userDocument) {
            this.userDocument = params.userDocument;
        }
    }

    /**
     * Get the object which can be sent to the C# interop layer
     * */
    getInteropObject() {

        return {
            DocRef: this.docRef,
            ...this.userDocument
        };
    }
}

/**
 * Class representing a firestore operation result
 * */
class FirestoreOperationResult {

    /**
     * Specify success or failure, followed by call specific params
     * @param {boolean} success
     * Denotes whether the operation was success or faiure
     * @param {any} params
     * Object containing one or more of below fields.
     * @type {FirestoreDocument} document
     * @type {FirestoreDocument[]} documentList
     * @type {any} error
     * Any error object which will be stringified and stored as string
     */
    constructor(success, params) {

        this.success = success;  /** @type {boolean} */

        // Populate optional fields
        if (params) {
            if (params.document) {
                this.document = params.document.getInteropObject();
            }
            if (params.documentList) {
                this.documentList = [];
                params.documentList.forEach(d => {
                    this.documentList.push(d.getInteropObject());
                });
            }
            if (params.error) {

                // Capture the stringified error since we don't always know the error structure
                this.errorJsonStr = JSON.stringify(params.error);

                // Parse the expected error fields
                if (params.error.code) {
                    this.errorCode = params.error.code;
                }
                if (params.error.name) {
                    this.errorName = params.error.name;
                }
            }
        }
    }
}

// Firestore database object
let db = null;

/**
 * Create a document in the specified collection.
 * @param {string} collection
 * The firestore collection to which to add the new document.
 * @param {string} documentStr
 * JSON string for the document to store in the above collection.
 * @returns {string}
 * FirestoreOperationResult json object stringified.
 * This result object is obtained with call to _getResultObject
 */
async function addDocument(collectionPath, documentStr) {

    if (db == null) {
        db = getFirestore();
    }

    try {

        const doc = new FirestoreDocument({ interopObject: JSON.parse(documentStr) });

        const docRef = await addDoc(collection(db, collectionPath), doc.userDocument);

        doc.docRef = new FirestoreDocRef(docRef);
        return JSON.stringify(new FirestoreOperationResult(true, { document: doc }));

    } catch (error) {

        console.error(error);
        return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
    }
}

async function getDocument(collectionPath, docId) {

    if (db == null) {
        db = getFirestore();
    }

    try {

        const docRef = doc(db, collectionPath, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {

            let userDocument = docSnap.data();

            return JSON.stringify(
                new FirestoreOperationResult(
                    true,
                    {
                        document:
                            new FirestoreDocument({
                                docRef: new FirestoreDocRef(docRef),
                                userDocument: userDocument
                            })
                    }));

        } else {

            return JSON.stringify(
                new FirestoreOperationResult(
                    false, { error: { name: 'Document does not exist.' } }));
        }

    } catch (error) {

        console.error(error);
        return JSON.stringify(
            new FirestoreOperationResult(false, { error: error }));
    }
}

async function getAllDocuments(collectionPath) {

    if (db == null) {
        db = getFirestore();
    }

    try {

        const snapshot = await getDocs(collection(db, collectionPath));
        const docList = [];
        snapshot.forEach(doc => {
            docList.push(new FirestoreDocument({
                docRef: new FirestoreDocRef(doc.ref),
                userDocument: doc.data()
            }));
        });

        return JSON.stringify(
            new FirestoreOperationResult(true, { documentList: docList }));

    } catch (error) {

        console.error(error);
        return JSON.stringify(
            new FirestoreOperationResult(false, { error: error }));
    }
}

async function setDocument(collectionPath, docId, documentStr) {

    if (db == null) {
        db = getFirestore();
    }

    try {

        const fsDoc = new FirestoreDocument({ interopObject: JSON.parse(documentStr) });
        const docRef = doc(db, collectionPath, docId);

        await setDoc(docRef, fsDoc.userDocument);

        return JSON.stringify(new FirestoreOperationResult(true, { document: fsDoc }));

    } catch (error) {

        console.error(error);
        return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
    }
}

async function updateDocument(collectionPath, docId, documentStr) {

    if (db == null) {
        db = getFirestore();
    }

    try {

        const fsDoc = new FirestoreDocument({ interopObject: JSON.parse(documentStr) });
        const docRef = doc(db, collectionPath, docId);

        await updateDoc(docRef, fsDoc.userDocument);

        return JSON.stringify(new FirestoreOperationResult(true));

    } catch (error) {

        console.error(error);
        return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
    }
}

async function onDocumentSnapshot(collectionPath, docId, assemblyName, authStateChangeCbName) {

    if (db == null) {
        db = getFirestore();
    }

    try {

        // todo :: add support to unsub from these snapshot updates
        const unsub = onSnapshot(doc(db, collectionPath, docId), doc => {

            let fsDoc = new FirestoreDocument({
                docRef: new FirestoreDocRef(doc.ref),
                userDocument: doc.data()
            });

            DotNet.invokeMethodAsync(assemblyName, authStateChangeCbName,
                docId, JSON.stringify(fsDoc.getInteropObject()));
        });

        return JSON.stringify(new FirestoreOperationResult(true));

    } catch (error) {

        console.error(error);
        return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
    }
}

/**
 * Function to delete the specified document.
 * https://firebase.google.com/docs/firestore/manage-data/delete-data
 * @param {string} collectionPath
 * @param {string} docId
 */
async function deleteDocument(collectionPath, docId) {

    if (db == null) {
        db = getFirestore();
    }

    try {

        const docRef = doc(db, collectionPath, docId);

        await deleteDoc(docRef);

        return JSON.stringify(new FirestoreOperationResult(true));

    } catch (error) {

        console.error(error);
        return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
    }
}

export {
    addDocument, getDocument, getAllDocuments, setDocument, updateDocument,
    onDocumentSnapshot, deleteDocument
};
