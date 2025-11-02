import type { LayoutProps } from "../Layout";
import { useOutletContext } from "react-router-dom";
import { useCart } from "../../CartContext";
import { FaTrashAlt } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import type { DataInterface } from "../CustNailProd/CustNailProd";

export function Cart(){
    const { isClicked, isDesktop } = useOutletContext<LayoutProps>();
    const TrashIcon: IconType = FaTrashAlt;
    const cartDataState = useCart();
    const {cartItems} = cartDataState;

    function handleDelete(itemId:number){
        cartDataState!.deleteItem!(itemId);
    }

    async function handleClickIncrement(itemId:number, cartQuantity:number) {
        try {
                const response = await fetch(`http://localhost:5000/products/${itemId}`);
                const data: DataInterface[] = await response.json();
                const stockQuantity = data[0].quantity;
                if (stockQuantity < cartQuantity + 1) {
                    alert("Max Quantity Reached");
                } else {
                      cartDataState!.incrementQuantity!(itemId);
                }  
                
            } catch (err) {
                console.log("ERROR: " + err);
            }
    }
    async function handleClickDecrement(itemId:number, cartQuantity:number) {
        try {
                if (cartQuantity - 1 <= 0) {
                    cartDataState!.deleteItem!(itemId);
                } else {
                    alert("Decrementing Item");
                    cartDataState!.decrementQuantity!(itemId);
                }  
                
            } catch (err) {
                console.log("ERROR: " + err);
            }
    }

    if (cartItems?.length! <= 0) 
        return (
            <div className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>
                <h1>Cart</h1>
                <h2 >0 Items in Cart</h2>
            </div>
        )

    return (
                <>
                    <h1 className={`${isClicked && isDesktop? 'open' : ''}`} style={{textAlign:"center"}}>Cart ({cartDataState!.cartTotalItems!()} items)</h1>
                    <div  className={`body row ${isClicked && isDesktop ? 'open' : ''}`}>
                        <div style={{display:"flex", flexDirection:"column",background:"darkgrey", borderRadius:"5px", borderColor:"black", minWidth:"300px"}}>
                        <p style={{textAlign:"center"}}>ITEMS IN CART</p>
                        {true && (<div style={{flex:"1 1 0"}}>
                            {cartItems!.map(item => (
                                <div>
                                    <div key={item.id} style={{display:"flex",flex:"1 1 0", alignContent:"center", gap:"5px"}}>
                                        <img src={`${item.image}`} style={{width:"100px", height:"100px",objectFit:"fill"}}/>
                                        <div>
                                            <h2>${(item.price * item.quantity).toFixed(2)} <span style={{opacity:"50%"}}>({item.price} each)</span></h2>
                                            <h3>{item.name}</h3>
                                        </div>
                                    </div>
                                    <p style={{textAlign:'center'}}>
                                    <button style={{margin:"10px"}} onClick={()=>handleClickDecrement(item.id,item.quantity)}>-</button>{item.quantity}<button style={{margin:"10px"}} onClick={()=>handleClickIncrement(item.id,item.quantity)}>+</button><button onClick={()=>handleDelete(item.id)} ><TrashIcon/></button>
                                    </p>
                                </div>
                            ))}
                        </div>)}
                        </div>
                    </div>
                </>
            );
}