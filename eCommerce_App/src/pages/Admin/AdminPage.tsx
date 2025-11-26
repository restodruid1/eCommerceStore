import { useState, useEffect } from "react";
import styles from './Admin.module.css'

export function AdminPage(){
    const [jwt, setJwt] = useState<boolean>(false);
    const [productName, setProductName] = useState("");
    const [productHeight, setProductHeight] = useState("");
    const [productLength, setProductLength] = useState("");
    const [productWidth, setProductWidth] = useState("");
    const [productWeight, setProductWeight] = useState("");
    const [productId, setProductId] = useState("");
    const [productImages, setProductImages] = useState<File[]>([]);
    const [products, setProducts] = useState([]);

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
        console.log(data);
        setProducts(data.result);
      }
      
      if (jwt) {
        getProductData();
      }
    },[jwt]);

    async function handleSubmit(e: React.FormEvent){
      e.preventDefault();
      console.log(productImages);
      
      const formData = new FormData();
      formData.append("productName", productName);
      formData.append("length", Number(productLength).toFixed(2));
      formData.append("width", Number(productWidth).toFixed(2));
      formData.append("height", Number(productHeight).toFixed(2));
      formData.append("weight", Number(productWeight).toFixed(2));
      formData.append("jwt", String(localStorage.getItem("jwt")));
      for (let i = 0; i < productImages!.length; i++) {
        formData.append("images", productImages![i]); 
      }

      console.log(formData);
      try {
        const response = await fetch("http://localhost:5000/api/admin/AwsS3", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("AWS FETCH: " + data);
        // setawsimage(data.message);
      } catch {
        console.log("eerror");
      }
    }

    function handleDeleteImage(imageIndex:number){
      setProductImages(prev => prev.filter((_, index) => index !== imageIndex));
    }


    if (!jwt) return <h1>not VALIDATED</h1> 
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
          <label className={styles.label}>Image(s)</label>
          <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files!);
                setProductImages(prev => [...prev, ...files]);
              }}
              required
              className={styles.formInput}
          />
          <ul>
            {productImages.map((file, idx) => (
              <li key={idx} >{file.name} <span onClick={()=>handleDeleteImage(idx)}>X</span></li>  
            ))}
          </ul>


          {/* {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>} */}


          <button
              type="submit"
              style={{width:'25%',padding: '0.75rem', borderRadius: '8px', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', background: '#333', color: 'white' }}
          >
          Submit
          </button>
      </form>
      <div style={{display:"flex", flexDirection:"column", justifyContent:"center", alignContent:"center"}}>
      {products.length > 0 && products.map((item:any, index)=>{
        return <p style={{display:"flex", maxHeight:"100px",border:"2px solid black"}} key={index}><img src={item.url}/>{item.name} {item.category} {item.price} {item.quantity} {item.weight}</p>
      })}
      </div>
    </div>
  )
}