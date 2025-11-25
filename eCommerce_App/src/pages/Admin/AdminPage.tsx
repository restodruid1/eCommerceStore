import { useState, useEffect } from "react";
import styles from './Admin.module.css'

export function AdminPage(){
    const [jwt, setJwt] = useState<boolean>(false);
    const [productName, setProductName] = useState("");
    const [productHeight, setProductHeight] = useState("");
    const [productLength, setProductLength] = useState("");
    const [productWidth, setProductWidth] = useState("");
    const [productWeight, setProductWeight] = useState("");

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
        }
    );


    function handleSubmit(e: React.FormEvent){
      e.preventDefault();
      const payload = {
        productName,
        length: Number(productLength).toFixed(2),
        width: Number(productWidth).toFixed(2),
        height: Number(productHeight).toFixed(2),
        weight: Number(productWeight).toFixed(2),
      };
    
      console.log(payload);
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


          {/* {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>} */}


          <button
              type="submit"
              style={{width:'25%',padding: '0.75rem', borderRadius: '8px', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', background: '#333', color: 'white' }}
          >
          Login
          </button>
      </form>
    </div>
  )
}