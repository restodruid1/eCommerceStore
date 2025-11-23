import { useState, useEffect } from "react";

export function AdminPage(){
    const [jwt, setJwt] = useState<boolean>(false);

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

    if (!jwt) return <h1>not VALIDATED</h1> 
    return <h1>ADMIN PAGE</h1>
}