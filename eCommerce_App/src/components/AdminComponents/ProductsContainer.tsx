import { useState} from "react";
import type { DataInterface } from "../../pages/Admin/AdminPage";
import { EditableProductCard } from "./EditableProductCard";
import type { Product } from "./EditableProductCard";
import { serverUrl } from "../../pages/Home/Home";

export function ProductsContainer({productCatalog, getProductData}:{productCatalog:DataInterface[], getProductData:()=>void}){ 
    const [error, setError] = useState("");


    async function handleDeleteProductFromDB(itemId:number, itemCategory:number){
        const response = await fetch(serverUrl ? serverUrl + `/api/admin/AwsS3/deleteProductData` : `http://localhost:5000/api/admin/AwsS3/deleteProductData`,{
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
        // console.log(product);
        try {
          const response = await fetch(serverUrl ? serverUrl + `/api/admin/AwsS3/updateProductData` : "http://localhost:5000/api/admin/AwsS3/updateProductData", {
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
        <div className="adminProductContainer">
          <p>{error}</p>
          {productCatalog.length > 0 && (
            <table >
              <thead>
                <tr>
                  <th>Images</th>
                  <th>Product Name</th>
                  <th>Product Category Id</th>
                  <th>Product Price</th>
                  <th>Product Quantity</th>
                  <th>Product Weight</th>
                  <th>Product Length</th>
                  <th>Product Height</th>
                  <th>Product Width</th>
                  <th>Product Description</th>
                  <th>Featured</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productCatalog.map((item:DataInterface, index)=>{
                    return (
                      <tr key={index}>
                        <EditableProductCard
                            key={index}
                            product={item}
                            updateProductInDB={updateProductInDB}
                            handleDeleteProductFromDB={handleDeleteProductFromDB}
                        />
                        </tr>
                    )
                })}
              </tbody>
            </table>
            
          )}
      </div>
    )
}