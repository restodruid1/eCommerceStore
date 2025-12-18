// TODO: Allow for updating of product images


// import styles from "../../pages/Admin/Admin.module.css";
// import { useState } from "react";
// import type { Product } from "./EditableProductCard";

// type EditableProps = {
//     urlObj:{imageId?:number, url:string},
//     index:number,
//     editing:boolean,
//     setProduct: React.Dispatch<React.SetStateAction<Product>>;
// }

// export function InlineEditableImageUrl({ urlObj, editing, index, setProduct }: EditableProps){
//     const { url } = urlObj;
//     const [localUrl, setLocalUrl] = useState(url);
//     const [isAddButtonClicked, setIsAddButtonClicked] = useState(false);
//     // console.log(url);
//     if (!editing) {
//         return (
//             <>
//                 <img src={url}><button onClick={
//                     () => {
//                     setProduct((prev) => ({
//                         ...prev,
//                         urls: prev.urls.filter((_, i) => i !== index),
//                     }));
//                 }}>D</button></img>
                
//                 {isAddButtonClicked ? (
//                     <div>
//                          <input
//                             value={localUrl}
//                             autoFocus
//                             onChange={(e) => setLocalUrl(e.target.value)}
//                             onBlur={() => {
//                                 setProduct((prev) => ({
//                                     ...prev,
//                                     urls: prev.urls.map((u, i) => i === index ? { ...u, url: localUrl } : u),
//                                 }));
//                             }}
//                             />
//                     </div>
//                 ) : (

//                     <button onClick={
//                         () => {
//                         setProduct((prev) => ({
//                             ...prev,
//                             urls: [...prev.urls, { url: localUrl }],
//                         }));
//                     }}>+</button>
//                 )
//                 }
                
//             </>
//         );
//     }


//     return (
//         <input
//             value={localUrl}
//             autoFocus
//             onChange={(e) => setLocalUrl(e.target.value)}
//             onBlur={() => {
//                 setProduct((prev) => ({
//                     ...prev,
//                     urls: prev.urls.map((u, i) => i === index ? { ...u, url: localUrl } : u),
//                 }));
//             }}
//             />
//         );
// }