using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace BlazorUtils.Firebase
{
    public class FirestoreOperationResult<T> where T: IFirestoreService.IFirestoreDocument
    {
        public bool Success { get; set; }
        public T Document { get; set; }
        public string ErrorCode { get; set; }
        public string ErrorName { get; set; }
        public string ErrorJsonStr { get; set; }
    }
}
