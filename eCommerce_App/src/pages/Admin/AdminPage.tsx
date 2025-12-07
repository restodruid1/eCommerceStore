import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styles from './Admin.module.css'

export function AdminPage(){
    const [jwt, setJwt] = useState<boolean>(false);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState("");
    const initialFormData = {
      productName: "",
      productHeight: "",
      productLength: "",
      productWidth: "",
      productWeight: "",
      productId: "",
      productPrice: "",
      productQuantity: "",
      productDescription: "",
      productImages: [] as File[],
    };
    const [formInputData, setFormInputData] = useState(initialFormData);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
      setProducts(data.result);
    }

    async function handleSubmit(e: React.FormEvent){
      e.preventDefault();
      console.log(formInputData.productImages);
      
      const skipFields = ["productImages", "productName", "productDescription"]; // only numeric fields checked

      for (const key in formInputData) {
        if (skipFields.includes(key)) continue; // skip non-numeric fields

        const value = formInputData[key as keyof typeof formInputData]; // TS type safety
        const numericValue = Number(value);

        if (isNaN(numericValue)) {
          console.log(`${key} is not a valid number:`, value);
          setError(`${key} needs to be a number`);
          return;
        } else {
          console.log(`${key} is a valid number:`, numericValue);
        }
      }

      const formData = new FormData();
      formData.append("productName", formInputData.productName);
      formData.append("category", formInputData.productId);
      formData.append("price", formInputData.productPrice);
      formData.append("quantity", String(parseInt(formInputData.productQuantity) > 0 ? parseInt(formInputData.productQuantity) : 1));
      formData.append("length", Number(formInputData.productLength).toFixed(2));
      formData.append("width", Number(formInputData.productWidth).toFixed(2));
      formData.append("height", Number(formInputData.productHeight).toFixed(2));
      formData.append("weight", Number(formInputData.productWeight).toFixed(2));
      formData.append("description", formInputData.productDescription);
      formData.append("jwt", String(localStorage.getItem("jwt")));
      for (let i = 0; i < formInputData.productImages!.length; i++) {
        formData.append("images", formInputData.productImages![i]); 
      }

      // console.log(formData);
      try {
        const response = await fetch("http://localhost:5000/api/admin/AwsS3", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("AWS FETCH: " + data);
        console.log("AWS FETCH: " + data.success);
        if (!data.success) {
          setError(data.error);
        } else {
          setError("");
          resetForm();
          getProductData();
        }
      } catch (err) {
        console.log("Error: ", err);
      }
    }

    function resetForm() {
      setFormInputData(initialFormData);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // clears the file input
      }
    }

    function handleDeleteImage(imageIndex:number){
      setFormInputData(prev => ({
        ...prev,
        productImages: prev.productImages.filter((_, index) => index !== imageIndex)
      }));
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

    const handleFormTextChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
    
      setFormInputData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleFormFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const fileName = e.target.files![0].name; 
      
      if (/\s/.test(fileName)) {
        setError("File name can't contain whitespace");
      } 
      else if (formInputData.productImages.some(file => file.name === fileName)) {
        setError("Duplicate file name");
      } 
      else {
        setError("");
        const files = Array.from(e.target.files!);
        setFormInputData(prev => ({
          ...prev,
          productImages: [...prev.productImages, ...files]
        }));
      }
    };

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
              value={formInputData.productName}
              onChange={handleFormTextChange}
              name="productName"
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Product Price</label>
          <input
              type="text"
              placeholder="1.99 1.00"
              value={formInputData.productPrice}
              onChange={handleFormTextChange}
              name="productPrice"
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Product Quantity</label>
          <input
              type="text"
              value={formInputData.productQuantity}
              onChange={handleFormTextChange}
              name="productQuantity"
              required
              className={styles.formInput}
          />
        
          <label className={styles.label}>Product ID <span>(1-4)</span></label>
          <input
              type="text"
              value={formInputData.productId}
              onChange={handleFormTextChange}
              name="productId"
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Length <span>(in)</span></label>
          <input
              type="text"
              value={formInputData.productLength}
              onChange={handleFormTextChange}
              name="productLength"
              placeholder="4, 4.2, 4.26"
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Width <span>(in)</span></label>
          <input
              type="text"
              value={formInputData.productWidth}
              onChange={handleFormTextChange}
              name="productWidth"
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Height <span>(in)</span></label>
          <input
              type="text"
              value={formInputData.productHeight}
              onChange={handleFormTextChange}
              name="productHeight"
              required
              className={styles.formInput}
          />
          
          <label className={styles.label}>Weight <span>(oz)</span></label>
          <input
              type="text"
              value={formInputData.productWeight}
              onChange={handleFormTextChange}
              name="productWeight"
              placeholder="10, 10.2, 10.22"
              required
              className={styles.formInput}
          />

          <label className={styles.label}>Description</label>
          <textarea
              value={formInputData.productDescription}
              onChange={handleFormTextChange}
              name="productDescription"
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
              ref={fileInputRef}
              onChange={handleFormFileChange}
              name="productImages"
              required
              className={styles.formInput}
          />

          {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

          <ul>
            {formInputData.productImages.map((file, idx) => (
              <li key={idx} ><span>{file.name} <button type="button" onClick={()=>handleDeleteImage(idx)}>X</button></span></li>  
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