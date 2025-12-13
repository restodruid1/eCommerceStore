import { useState } from "react";

type ItemQuantityProps = {
    stock: number;
    selectedCartQuantityFromCheckout?: number;
    setSelectedQuantity: (amount:number)=> void;
    setErrorMessage: (message:string)=> void;
}

export function ItemQuantityCard({stock, selectedCartQuantityFromCheckout, setSelectedQuantity, setErrorMessage}:ItemQuantityProps){
    const [selectedValue, setSelectedValue] = useState(0);

    return (
        <select
            value={selectedCartQuantityFromCheckout ?? selectedValue}
            disabled={stock <= 0}
            onChange={(e)=>{
                setSelectedValue(Number(e.target.value));
                setSelectedQuantity(Number(e.target.value));
                setErrorMessage("");
            }}
        >
            {selectedCartQuantityFromCheckout === undefined && (<option value={0}>
                {stock > 0 ? "Select quantity" : "Out Of Stock"}
            </option>)}
            {(selectedCartQuantityFromCheckout != undefined && stock <= 0) && (<option value={0}>
                {"Out Of Stock"}
            </option>)}
            

            {Array.from({ length: stock }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                {i + 1}
                </option>
            ))}
        </select>
    )
}