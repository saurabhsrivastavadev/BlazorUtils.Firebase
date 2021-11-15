// firestore.js
// Wrappers on top of firestore javascript sdk

/**
 * Class representing a firestore document reference data
 * */
export class FirestoreDocRef {

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
export class FirestoreDocument {

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
export class FirestoreOperationResult {

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
export async function addDocument(collection, documentStr) {

    import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.3.0/firebase-firestore.js';

    if (db == null) {
        db = getFirestore();
    }

    try {

        let doc = new FirestoreDocument({ interopObject: JSON.parse(documentStr) });
        let docRef = await db.collection(collection).add(doc.userDocument);
        doc.docRef = new FirestoreDocRef(docRef);
        return JSON.stringify(new FirestoreOperationResult(true, { document: doc }));

    } catch (error) {

        return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
    }
}

export async function getDocument(collection, docId) {

    if (db == null) {
        db = firebase.firestore();
    }

    try {

        let docRef = await db.collection(collection).doc(docId);
        let doc = await docRef.get();
        if (doc.exists) {

            let userDocument = doc.data();
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

        return JSON.stringify(
            new FirestoreOperationResult(false, { error: error }));
    }
}

export async function getAllDocuments(collection) {

    if (db == null) {
        db = firebase.firestore();
    }

    try {

        let snapshot = await db.collection(collection).get();
        let docList = [];
        snapshot.forEach(doc => {
            docList.push(new FirestoreDocument({
                docRef: new FirestoreDocRef(doc.ref),
                userDocument: doc.data()
            }));
        });

        return JSON.stringify(
            new FirestoreOperationResult(true, { documentList: docList }));

    } catch (error) {

        return JSON.stringify(
            new FirestoreOperationResult(false, { error: error }));
    }
}

export async function setDocument(collection, docId, documentStr) {

    if (db == null) {
        db = firebase.firestore();
    }

    try {

        let doc = new FirestoreDocument({ interopObject: JSON.parse(documentStr) });
        let docRef = await db.collection(collection).doc(docId);

        await docRef.set(doc.userDocument);

        return JSON.stringify(new FirestoreOperationResult(true, { document: doc }));

    } catch (error) {

        return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
    }
}

export async function updateDocument(collection, docId, documentStr) {

    if (db == null) {
        db = firebase.firestore();
    }

    try {

        let doc = new FirestoreDocument({ interopObject: JSON.parse(documentStr) });
        let docRef = await db.collection(collection).doc(docId);

        await docRef.update(doc.userDocument);

        return JSON.stringify(new FirestoreOperationResult(true));

    } catch (error) {

        return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
    }
}

export async function onSnapshot(collection, docId, assemblyName, authStateChangeCbName) {

    if (db == null) {
        db = firebase.firestore();
    }

    try {

        db.collection(collection).doc(docId).onSnapshot(doc => {

            let document = new FirestoreDocument({
                docRef: new FirestoreDocRef(doc.ref),
                userDocument: doc.data()
            });

            DotNet.invokeMethodAsync(assemblyName, authStateChangeCbName,
                docId, JSON.stringify(document.getInteropObject()));
        });

        return JSON.stringify(new FirestoreOperationResult(true));

    } catch (error) {

        return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
    }
}
