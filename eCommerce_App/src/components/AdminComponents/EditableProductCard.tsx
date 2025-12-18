import { useEffect, useState } from "react";
import { FaPencilAlt } from "react-icons/fa";

type InlineEditableFieldProps = {
    value: string | number;
    editing: boolean;
    type?: "text" | "number" | "text-area";
    onChange: (val: string) => void;
  };
  
function InlineEditableField({
    value,
    editing,
    onChange,
    type = "text",
}: InlineEditableFieldProps) {
    if (!editing) {
        return <p>{value}</p>;
    }

    return (
        <input
        type={type}
        value={value}
        autoFocus
        onChange={(e) => onChange(e.target.value)}
        className="inline-input"
        />
    );
}


export type Product = {
    id: number;
    name: string;
    category: number;
    price: number;
    quantity: number;
    weight: number;
    description: string;
    urls: {imageId?:number, url:string}[];
  };
  
  type EditableProductCardProps = {
    product: Product;
    updateProductInDB: (product: Product) => void;
    handleDeleteProductFromDB: (id: number, category: number) => void;
  };
  
  export function EditableProductCard({ product, updateProductInDB, handleDeleteProductFromDB, }: EditableProductCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftProduct, setDraftProduct] = useState<Product>(product);


    useEffect(()=>{
      setDraftProduct(product);
    },[product]);

    function startEditing() {
      setDraftProduct(product); // reset draft
      setIsEditing(true);
    }
  
    function submit() {
      updateProductInDB(draftProduct);
      setIsEditing(false);
    }
  
    function cancel() {
      setDraftProduct(product);
      setIsEditing(false);
    }
  

    return (
      <div className="row" style={{display:"flex", justifyContent:"space-between", maxHeight:"100px",border:"2px solid black"}}>
            
        {draftProduct.urls.map((urlObj, index) => <img key={index} src={urlObj.url}/>)}

        <InlineEditableField
          value={draftProduct.name}
          editing={isEditing}
          onChange={(val) =>
            setDraftProduct((p) => ({ ...p, name: val }))
          }
        />
  
        <InlineEditableField
          value={draftProduct.category}
          type="number"
          editing={isEditing}
          onChange={(val) =>
            setDraftProduct((p) => ({ ...p, category: Number(val) }))
          }
        />
  
        <InlineEditableField
          value={draftProduct.price}
          type="number"
          editing={isEditing}
          onChange={(val) =>
            setDraftProduct((p) => ({ ...p, price: Number(val) }))
          }
        />
  
        <InlineEditableField
          value={draftProduct.quantity}
          type="number"
          editing={isEditing}
          onChange={(val) =>
            setDraftProduct((p) => ({ ...p, quantity: Number(val) }))
          }
        />
  
        <InlineEditableField
          value={draftProduct.weight}
          type="number"
          editing={isEditing}
          onChange={(val) =>
            setDraftProduct((p) => ({ ...p, weight: Number(val) }))
          }
        />

        <InlineEditableField
          value={draftProduct.description}
          type="text-area"
          editing={isEditing}
          onChange={(val) =>
            setDraftProduct((p) => ({ ...p, description: val }))
          }
        />
  
        {!isEditing ? (
          <>
            <button onClick={startEditing}>
              <FaPencilAlt />
            </button>

            <button
              onClick={() =>
                handleDeleteProductFromDB(product.id, product.category)
              }
            >
              X
            </button>
          </>
        ) : (
          <>
            <button onClick={submit}>Save</button>
            <button onClick={cancel}>Cancel</button>
          </>
        )}
  
      </div>
    );
  }