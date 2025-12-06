import { useState, useEffect } from "react";
import { useCart } from "../../CartContext";
import type { CartItem } from "../../CartContext";
import type { DataInterface } from "../../pages/CustNailProd/CustNailProd";
import { FaTrashAlt } from 'react-icons/fa';
import type { IconType } from 'react-icons';


interface CartProductCardProps {
    itemInfo: CartItem;
  }

export function CartProductCard ({ itemInfo }: CartProductCardProps){
    const cartDataState = useCart();
    const TrashIcon: IconType = FaTrashAlt;
    const [ outOfStockMessage, setOutOfStockMessage] = useState<string>("");
    const [ productStock, setProductStock ] = useState<number>(0);


    useEffect(() => {
        const fetchProductStock = async () => {
            try {
                const response = await fetch(`http://localhost:5000/products/${itemInfo.id}`);
                const data: DataInterface[] = await response.json();
                console.log("DATA: " + data);
                setProductStock(data ? data[0].quantity : 0);
            } catch (err) {
                console.log("ERROR: " + err);
            }
        };
        fetchProductStock();
      }, []);
    
    
    useEffect(() => {
        if (!outOfStockMessage) return;
      
        const timer = setTimeout(() => {
            setOutOfStockMessage("");
        }, 5000);
      
        return () => clearTimeout(timer); // cleanup
      }, [outOfStockMessage]);
    
    function handleDelete(itemId:number){
        cartDataState!.deleteItem!(itemId);
    }


    async function handleClickIncrement(itemId:number, cartQuantity:number) {
        try {
            if (productStock < cartQuantity + 1) {
                // alert("Max Quantity Reached");
                setOutOfStockMessage(`Only ${productStock} available`);
                cartDataState!.decrementQuantity!(itemId, cartQuantity - productStock);
            } else {
                    cartDataState!.incrementQuantity!(itemId, 1);
            }  
        } catch (err) {
            console.log("ERROR: " + err);
        }
    }


    async function handleClickDecrement(itemId:number, cartQuantity:number) {
        try {
            if (cartQuantity - 1 <= 0) {
                cartDataState!.deleteItem!(itemId);
            } else if (productStock < cartQuantity - 1) {
                cartDataState!.decrementQuantity!(itemId, cartQuantity - productStock);
            } else {
                // alert("Decrementing Item");
                cartDataState!.decrementQuantity!(itemId, 1);
            }  
            // cartDataState!.decrementQuantity!(itemId, 1);
        } catch (err) {
            console.log("ERROR: " + err);
        }
    }
    
    return (
        <div>
            <div style={{display:"flex",flex:"1 1 0", alignContent:"center", gap:"5px"}}>
                <img src={`${itemInfo.image}`} style={{width:"100px", height:"100px",objectFit:"fill"}}/>
                <div>
                    <h2>${(itemInfo.price * itemInfo.quantity).toFixed(2)} <span style={{opacity:"50%"}}>({itemInfo.price} each)</span></h2>
                    <h3>{itemInfo.name}</h3>
                </div>
            </div>
            {outOfStockMessage && <p style={{color:"red", textAlign:'center'}}>{outOfStockMessage}</p>}
            <p style={{textAlign:'center'}}>
                <button style={{margin:"10px"}} onClick={()=>handleClickDecrement(itemInfo.id,itemInfo.quantity)}>-</button>{itemInfo.quantity}<button style={{margin:"10px"}} onClick={()=>handleClickIncrement(itemInfo.id,itemInfo.quantity)}>+</button><button onClick={()=>handleDelete(itemInfo.id)} ><TrashIcon/></button>
            </p>
        </div>
    )
}