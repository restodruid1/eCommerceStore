import { useState} from "react";
import type { DataInterface } from "../../pages/Admin/AdminPage";
import { EditableProductCard } from "./EditableProductCard";
import type { Product } from "./EditableProductCard";


export function ProductsContainer({productCatalog, getProductData}:{productCatalog:DataInterface[], getProductData:()=>void}){ 
    const [error, setError] = useState("");


    async function handleDeleteProductFromDB(itemId:number, itemCategory:number){
        const response = await fetch(`http://localhost:5000/api/admin/AwsS3/deleteProductData`,{
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
                jwt: localStorage.getItem("jwt"),
                itemId: itemId,
                itemCategory: itemCategory
            })  
        });

        const data = await response.json();
        // alert(data);
        console.log(data);
        if (!data.success) return;
        getProductData();
        // setProducts(data.result);
    }

    async function updateProductInDB(product:Product){
        console.log("here homy");
        console.log(product);
        try {
          const response = await fetch("http://localhost:5000/api/admin/AwsS3/updateProductData", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
                jwt: localStorage.getItem("jwt"),
                product: product
            })
          })

          if (!response.ok) throw new Error;
          const data = await response.json();
          console.log(data);
          getProductData();

        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Error occured with updating product info");
          }
        }
    }
    

    return (
        <div style={{display:"flex", flexDirection:"column", justifyContent:"center", alignContent:"center"}}>
          <p>{error}</p>
          {productCatalog.length > 0 && (
            <div style={{display:"flex", justifyContent:"space-between", borderBottom:"2px solid black", maxHeight:"100px"}}>
              <h3>Images</h3>
              <h3>Product Name</h3>
              <h3>Product Category Id</h3>
              <h3>Product Price</h3>
              <h3>Product Quantity</h3>
              <h3>Product Weight</h3>
              <h3>Product Description</h3>
            </div>
          )}
          {productCatalog.length > 0 && productCatalog.map((item:DataInterface, index)=>{
              return (
                  <EditableProductCard
                      key={index}
                      product={item}
                      updateProductInDB={updateProductInDB}
                      handleDeleteProductFromDB={handleDeleteProductFromDB}
                  />
              )
          })}
      </div>
    )
}