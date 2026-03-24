import { useState} from "react";
import type { DataInterface } from "../../pages/Admin/AdminPage";
import { EditableProductCard } from "./EditableProductCard";
import type { Product } from "./EditableProductCard";
import { buildUrl } from "../../helper/helpers";
import styles from "../../pages/Admin/Admin.module.css";

export function ProductsContainer({productCatalog, getProductData}:{productCatalog:DataInterface[], getProductData:()=>void}){ 
    const [error, setError] = useState("");


    async function handleDeleteProductFromDB(itemId:number, itemCategory:number){
        const response = await fetch(buildUrl(`/api/admin/AwsS3/deleteProductData`),{
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

    async function addProductImage(productId: number, file: File) {
        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("productId", String(productId));
            formData.append("jwt", String(localStorage.getItem("jwt")));
            const response = await fetch(buildUrl(`/api/admin/AwsS3/addProductImage`), {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            getProductData();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
        }
    }

    async function deleteProductImage(imageId: number) {
        try {
            const response = await fetch(buildUrl(`/api/admin/AwsS3/deleteProductImage`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jwt: localStorage.getItem("jwt"), imageId }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            getProductData();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
        }
    }

    async function setMainImage(imageId: number, productId: number) {
        try {
            const response = await fetch(buildUrl(`/api/admin/AwsS3/setMainImage`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jwt: localStorage.getItem("jwt"), imageId, productId }),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            getProductData();
        } catch (err) {
            if (err instanceof Error) setError(err.message);
        }
    }

    async function updateProductInDB(product:Product){
        // console.log(product);
        try {
          const response = await fetch(buildUrl(`/api/admin/AwsS3/updateProductData`), {
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
            <div className={styles.tableContainer}>
            <table style={{width:"100%", borderCollapse:"collapse", whiteSpace:"nowrap"}}>
              <thead>
                <tr>
                  <th>Images</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Weight (oz)</th>
                  <th>Length (in)</th>
                  <th>Height (in)</th>
                  <th>Width (in)</th>
                  <th style={{minWidth:"200px"}}>Description</th>
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
                            addProductImage={addProductImage}
                            deleteProductImage={deleteProductImage}
                            setMainImage={setMainImage}
                        />
                        </tr>
                    )
                })}
              </tbody>
            </table>
            </div>
          )}
      </div>
    )
}