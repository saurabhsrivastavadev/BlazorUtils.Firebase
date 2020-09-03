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
