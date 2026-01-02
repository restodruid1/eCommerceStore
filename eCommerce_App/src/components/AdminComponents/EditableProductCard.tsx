import { useEffect, useState } from "react";
import { FaPencilAlt } from "react-icons/fa";

export type InlineEditableFieldProps = {
    value: string | number;
    editing: boolean;
    type?: "text" | "number" | "text-area";
    onChange: (val: string) => void;
  };
  
export function InlineEditableField({
    value,
    editing,
    onChange,
    type = "text",
}: InlineEditableFieldProps) {
    if (!editing) {
        return <p>{value}</p>;
    }


    switch (type) {
      case "text-area":
        return (
          <textarea
            value={value}
            maxLength={8000}
            autoFocus
            onChange={(e) => onChange(e.target.value)}
            className="inline-input"
          />
        )
        break;
      case "number":
      case "text":    
      default:
        return (
          <input
            type={type}
            value={value}
            autoFocus
            onChange={(e) => onChange(e.target.value)}
            className="inline-input"
          />
      )
        break;
    }
    
}


export type Product = {
    id: number;
    name: string;
    category: number;
    price: number;
    quantity: number;
    weight: number;
    length: number;
    height: number;
    width: number;
    description: string;
    urls: {imageId?:number, url:string}[];
    featured: boolean;
  };
  
  type EditableProductCardProps = {
    product: Product;
    updateProductInDB: (product: Product) => void;
    handleDeleteProductFromDB: (id: number, category: number) => void;
  };
  
  export function EditableProductCard({ product, updateProductInDB, handleDeleteProductFromDB, }: EditableProductCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftProduct, setDraftProduct] = useState<Product>(product);
    // console.log("FEATURED DATA: ", draftProduct);

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
      <>
            
        <td>{draftProduct.urls.map((urlObj, index) => <img style={{maxHeight:"60%", maxWidth:"60%", objectFit:"contain"}} key={index} src={urlObj.url}/>)}</td>

        <td>
          <InlineEditableField
            value={draftProduct.name}
            editing={isEditing}
            onChange={(val) =>
              setDraftProduct((p) => ({ ...p, name: val }))
            }
        />
        </td>
  
        <td>
          <InlineEditableField
            value={draftProduct.category}
            type="number"
            editing={isEditing}
            onChange={(val) =>
              setDraftProduct((p) => ({ ...p, category: Number(val) }))
            }
          />
        </td>
  
        <td>
          <InlineEditableField
            value={draftProduct.price}
            type="number"
            editing={isEditing}
            onChange={(val) =>
              setDraftProduct((p) => ({ ...p, price: Number(val) }))
            }
          />
        </td>
  
        <td>
          <InlineEditableField
            value={draftProduct.quantity}
            type="number"
            editing={isEditing}
            onChange={(val) =>
              setDraftProduct((p) => ({ ...p, quantity: Number(val) }))
            }
          />
        </td>
  
        <td>
          <InlineEditableField
            value={draftProduct.weight}
            type="number"
            editing={isEditing}
            onChange={(val) =>
              setDraftProduct((p) => ({ ...p, weight: Number(val) }))
            }
          />
        </td>

        <td>
          <InlineEditableField
            value={draftProduct.length}
            type="number"
            editing={isEditing}
            onChange={(val) =>
              setDraftProduct((p) => ({ ...p, length: Number(val) }))
            }
          />
        </td>

        <td>
          <InlineEditableField
            value={draftProduct.height}
            type="number"
            editing={isEditing}
            onChange={(val) =>
              setDraftProduct((p) => ({ ...p, height: Number(val) }))
            }
          />
        </td>

        <td>
          <InlineEditableField
            value={draftProduct.width}
            type="number"
            editing={isEditing}
            onChange={(val) =>
              setDraftProduct((p) => ({ ...p, width: Number(val) }))
            }
          />
        </td>

        <td>
          <InlineEditableField
            value={draftProduct.description}
            type="text-area"
            editing={isEditing}
            onChange={(val) =>
              setDraftProduct((p) => ({ ...p, description: val }))
            }
          />
        </td>
        
        <td>
          <input
              type="checkbox"
              checked={draftProduct.featured}
              disabled={isEditing ? false : true}
              onChange={e => setDraftProduct((p) => ({ ...p, featured: e.target.checked }))}
              className="inline-input"
            />
        </td>
  
        {!isEditing ? (
          <td>
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
          </td>
        ) : (
          <td>
            <button onClick={submit}>Save</button>
            <button onClick={cancel}>Cancel</button>
          </td>
        )}
  
      </>
    );
  }