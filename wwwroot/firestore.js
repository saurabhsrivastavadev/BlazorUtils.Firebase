
// Wrappers on top of firebase javascript sdk

// Initialize our base objects
if (!window.blazor_utils) {
    window.blazor_utils = {};
}
if (!window.blazor_utils.firebase) {
    window.blazor_utils.firebase = {};
}
if (!window.blazor_utils.firebase.firestore) {
    window.blazor_utils.firebase.firestore = {};
}

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

// Define the firebase firestore object
window.blazor_utils.firebase.firestore = {

    // Firestore database object
    db: null,

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
    addDocument: async function (collection, documentStr) {

        if (this.db == null) {
            this.db = firebase.firestore();
        }

        try {

            let doc = new FirestoreDocument({ interopObject: JSON.parse(documentStr) });
            let docRef = await this.db.collection(collection).add(doc.userDocument);
            doc.docRef = new FirestoreDocRef(docRef);
            return JSON.stringify(new FirestoreOperationResult(true, { document: doc }));

        } catch (error) {

            return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
        }
    },

    getDocument: async function (collection, docId) {

        if (this.db == null) {
            this.db = firebase.firestore();
        }

        try {

            let docRef = await this.db.collection(collection).doc(docId);
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
    },

    getAllDocuments: async function (collection) {

        if (this.db == null) {
            this.db = firebase.firestore();
        }

        try {

            let snapshot = await this.db.collection(collection).get();
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
    },

    setDocument: async function (collection, docId, documentStr) {

        if (this.db == null) {
            this.db = firebase.firestore();
        }

        try {

            let doc = new FirestoreDocument({ interopObject: JSON.parse(documentStr) });
            let docRef = await this.db.collection(collection).doc(docId);

            await docRef.set(doc.userDocument);

            return JSON.stringify(new FirestoreOperationResult(true, { document: doc }));

        } catch (error) {

            return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
        }
    },

    updateDocument: async function (collection, docId, documentStr) {

        if (this.db == null) {
            this.db = firebase.firestore();
        }

        try {

            let doc = new FirestoreDocument({ interopObject: JSON.parse(documentStr) });
            let docRef = await this.db.collection(collection).doc(docId);

            await docRef.update(doc.userDocument);

            return JSON.stringify(new FirestoreOperationResult(true));

        } catch (error) {

            return JSON.stringify(new FirestoreOperationResult(false, { error: error }));
        }
    },
};
