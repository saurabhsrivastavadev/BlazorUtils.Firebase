using Microsoft.AspNetCore.Components;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BlazorUtils.Firebase
{
    public interface IFirestoreService
    {
        /// <summary>
        /// Add the specified document to the specified collection in the app datastore.
        /// </summary>
        /// <typeparam name="T">
        /// Type of document, can be any class which can be converted to JSON notation.
        /// </typeparam>
        /// <param name="collection">
        /// The firestore collection path where to store the document.
        /// </param>
        /// <param name="document">
        /// The document object to be stored.
        /// </param>
        /// <returns>
        /// Result of this add document operation, containing a firestore document reference
        /// if this operation succeeds.
        /// </returns>
        Task<FirestoreOperationResult<T>> AddDocument<T>(string collection, T document) where T : IFirestoreDocument;

        /// <summary>
        /// Fetch a single document from the specified firestore collection
        /// </summary>
        /// <typeparam name="T">
        /// Type of document fetched from the firestore.
        /// </typeparam>
        /// <param name="collection">
        /// The firestore collection path.
        /// </param>
        /// <param name="docId">
        /// The firestore document id for the document to be fetched.
        /// </param>
        /// <returns>
        /// Firestore operation result which contains the document object fetched from
        /// firestore if the operation is successful.
        /// </returns>
        Task<FirestoreOperationResult<T>> GetDocument<T>(string collection, string docId) where T : IFirestoreDocument;

        /// <summary>
        /// Fetch all documents from the specified firestore collection
        /// </summary>
        /// <typeparam name="T">
        /// Type of document fetched from the firestore.
        /// </typeparam>
        /// <param name="collection">
        /// The firestore collection path.
        /// </param>
        /// <returns>
        /// Firestore operation result which contains the document object list fetched from
        /// firestore if the operation is successful.
        /// </returns>
        Task<FirestoreOperationResult<T>> GetAllDocuments<T>(string collection) where T : IFirestoreDocument;

        /// <summary>
        /// Set the specified document (with docId) in firestore
        /// Creates a new document (with specified docId) if no document exists
        /// Replaces the document completely with the new one if one exists.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="collection">
        /// Firestore collection where the document is located
        /// </param>
        /// <param name="docId">
        /// Document id used to identify the document in the collection
        /// </param>
        /// <param name="document">
        /// New document object which will overwrite the existing document in firestore.
        /// </param>
        /// <returns>
        /// Operation result containing the updated document.
        /// </returns>
        Task<FirestoreOperationResult<T>> SetDocument<T>(
            string collection, string docId, T document) where T : IFirestoreDocument;

        /// <summary>
        /// Update the firestore document with only the fields of specified document.
        /// </summary>
        /// <typeparam name="P">
        /// Parent document class, which is the complete document stored in firestore.
        /// </typeparam>
        /// <typeparam name="C">
        /// Child document class, which is a subset of fields we wish to update with this operation.
        /// </typeparam>
        /// <param name="collection">
        /// Firestore collection where the document to update resides.
        /// </param>
        /// <param name="docId">
        /// Firestore document id for the document to update.
        /// </param>
        /// <param name="document">
        /// Document containing only the fields that need to be updated in the firestore document.
        /// Do not keep any fields in this Document which need not be updated in firestore document.
        /// </param>
        /// <returns>
        /// Operation result indicating success or failure.
        /// </returns>
        Task<FirestoreOperationResult<P>> UpdateDocument<P, C>(
            string collection, string docId, C document) where C : IFirestoreDocument where P : C;

        /// <summary>
        /// Callback received on subscription to document updates
        /// </summary>
        /// <param name="document">The updated document</param>
        delegate void DocumentUpdateCallback(IFirestoreDocument document);

        /// <summary>
        /// Subscribe to listen to any updates to a firestore document
        /// </summary>
        /// <param name="collection">
        /// Firestore collection where the document to subscribe resides.
        /// </param>
        /// <param name="docId">Firestore Document ID</param>
        /// <param name="callback">Subscription Callback</param>
        /// <returns>Operation result indicating success or failure</returns>
        Task<FirestoreOperationResult<T>> SubscribeForDocumentUpdates<T>(
            string collection, string docId, DocumentUpdateCallback callback) where T : IFirestoreDocument;

        // todo
        //Task<FirestoreOperationResult<T>> UnsubscribeForDocumentUpdates<T>(string docId) where T : IFirestoreDocument;

        /// <summary>
        /// Firestore document reference
        /// </summary>
        public class FirestoreDocRef
        {
            public string DocId { get; set; }
            public string DocPath { get; set; }
            public FirestoreDocRef ParentDocRef { get; set; }
        }

        /// <summary>
        /// Firestore Document Mandatory Fields
        /// </summary>
        public interface IFirestoreDocument
        {
            public FirestoreDocRef DocRef { get; set; }
        }
    }
}
