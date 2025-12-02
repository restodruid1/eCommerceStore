import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from './Admin.module.css'

export function AdminPage(){
    const [jwt, setJwt] = useState<boolean>(false);
    const [productName, setProductName] = useState("");
    const [productHeight, setProductHeight] = useState("");
    const [productLength, setProductLength] = useState("");
    const [productWidth, setProductWidth] = useState("");
    const [productWeight, setProductWeight] = useState("");
    const [productId, setProductId] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productQuantity, setProductQuantity] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [productImages, setProductImages] = useState<File[]>([]);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState("");

    // Validate clients hitting this page
    useEffect(()=>{
        async function validate(){
            const response = await fetch(`http://localhost:5000/api/admin/page`,{
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jwt: localStorage.getItem("jwt")
                })
              });
              const data = await response.json();
            //   console.log(data);
              if (data.message === "valid") {
                setJwt(true)
              }
              else {
                setJwt(false);
                }
            }
        validate();
        },[]);

    useEffect(()=>{
      if (!jwt) return;
      if (jwt) {
        getProductData();
      }
    },[jwt]);

    async function getProductData(){
      const response = await fetch(`http://localhost:5000/api/admin/AwsS3/productData`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jwt: localStorage.getItem("jwt")
        })
        
      });
      const data = await response.json();
      // alert(data);
      // console.log(data);
      setProducts(data.result);
    }

    async function handleSubmit(e: React.FormEvent){
      e.preventDefault();
      console.log(productImages);
      
      const formData = new FormData();
      formData.append("productName", productName);
      formData.append("category", productId);
      formData.append("price", productPrice);
      formData.append("quantity", String(parseInt(productQuantity) > 0 ? parseInt(productQuantity) : 1));
      formData.append("length", Number(productLength).toFixed(2));
      formData.append("width", Number(productWidth).toFixed(2));
      formData.append("height", Number(productHeight).toFixed(2));
      formData.append("weight", Number(productWeight).toFixed(2));
      formData.append("description", productDescription);
      formData.append("jwt", String(localStorage.getItem("jwt")));
      for (let i = 0; i < productImages!.length; i++) {
        formData.append("images", productImages![i]); 
      }

      // console.log(formData);
      try {
        const response = await fetch("http://localhost:5000/api/admin/AwsS3", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        // console.log("AWS FETCH: " + data);
        if (!data) return;
        getProductData();
      } catch {
        console.log("eerror");
      }
    }

    function handleDeleteImage(imageIndex:number){
      setProductImages(prev => prev.filter((_, index) => index !== imageIndex));
    }

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


    if (!jwt) 
      return (
      <div className={styles.formFlex}>
          <h1>not VALIDATED</h1>
          <Link to={"/admin"}>Back to admin login</Link>
          </div> 
        )
    return (
      <div>
        <form className={styles.formFlex} onSubmit={handleSubmit}>
          <h1>ADMIN PAGE</h1>
          <label className={styles.label}>Product Name</label>
          <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Product Price</label>
          <input
              type="text"
              placeholder="1.99 1.00"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Product Quantity</label>
          <input
              type="text"
              value={productQuantity}
              onChange={(e) => setProductQuantity(e.target.value)}
              required
              className={styles.formInput}
          />
        
          <label className={styles.label}>Product ID <span>(1-4)</span></label>
          <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Length <span>(in)</span></label>
          <input
              type="text"
              value={productLength}
              onChange={(e) => setProductLength(e.target.value)}
              placeholder="4, 4.2, 4.26"
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Width <span>(in)</span></label>
          <input
              type="text"
              value={productWidth}
              onChange={(e) => setProductWidth(e.target.value)}
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Height <span>(in)</span></label>
          <input
              type="text"
              value={productHeight}
              onChange={(e) => setProductHeight(e.target.value)}
              required
              className={styles.formInput}
          />
          
          <label className={styles.label}>Weight <span>(oz)</span></label>
          <input
              type="text"
              value={productWeight}
              onChange={(e) => setProductWeight(e.target.value)}
              placeholder="10, 10.2, 10.22"
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Description</label>
          <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={6}
              maxLength={999}
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Image(s)</label>
          <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                if (/\s/.test(e.target.files![0].name)) {
                  setError("File can't contain whitespace");
                } else {
                  setError("");
                  const files = Array.from(e.target.files!);
                  setProductImages(prev => [...prev, ...files]);
                }
              }}
              required
              className={styles.formInput}
          />

          {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

          <ul>
            {productImages.map((file, idx) => (
              <li key={idx} >{file.name} <span onClick={()=>handleDeleteImage(idx)}>X</span></li>  
            ))}
          </ul>

          <button
              type="submit"
              style={{width:'25%',padding: '0.75rem', borderRadius: '8px', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', background: '#333', color: 'white' }}
          >
          Submit
          </button>
      </form>
      <div style={{display:"flex", flexDirection:"column", justifyContent:"center", alignContent:"center"}}>
      {products.length > 0 && products.map((item:any, index)=>{
        return (
        <p style={{display:"flex", maxHeight:"100px",border:"2px solid black"}} key={index}>
          <img style={{maxWidth:"150px", minHeight:"100px"}} src={item.url}/>
          {item.name} {item.category} {item.price} {item.quantity} {item.weight}
          <button onClick={()=>handleDeleteProductFromDB(item.id, item.category)}>X</button>
          </p>
      )
      })}
      </div>
    </div>
  )
}