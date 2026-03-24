import { useEffect, useState } from "react";
import { FaPencilAlt } from "react-icons/fa";
import styles from "../../pages/Admin/Admin.module.css";

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
        );
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
        );
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
    urls: {imageId?:number, url:string, main_image?:boolean}[];
    featured: boolean;
  };
  
  type EditableProductCardProps = {
    product: Product;
    updateProductInDB: (product: Product) => void;
    handleDeleteProductFromDB: (id: number, category: number) => void;
    addProductImage: (productId: number, file: File) => Promise<void>;
    deleteProductImage: (imageId: number) => Promise<void>;
    setMainImage: (imageId: number, productId: number) => Promise<void>;
  };

  export function EditableProductCard({ product, updateProductInDB, handleDeleteProductFromDB, addProductImage, deleteProductImage, setMainImage }: EditableProductCardProps) {
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
            
        <td>
          <div className={styles.imageContainer}>
            {draftProduct.urls.map((urlObj, index) => (
              <div key={index} className={styles.imageCard}>
                <div className={styles.imageWrapper}>
                  <img
                    src={urlObj.url}
                    style={{width:"80px", height:"80px", objectFit:"cover", borderRadius:"4px", border: urlObj.main_image ? "2px solid gold" : "2px solid transparent"}}
                  />
                  {urlObj.main_image && <span className={styles.mainStar}>⭐</span>}
                </div>
                {isEditing && urlObj.imageId && (
                  <div className={styles.imageButtons}>
                    <button type="button" onClick={() => deleteProductImage(urlObj.imageId!)}>Delete</button>
                    {!urlObj.main_image && (
                      <button type="button" onClick={() => setMainImage(urlObj.imageId!, draftProduct.id)}>Main</button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                style={{fontSize:"0.75em"}}
                onChange={(e) => {
                  if (!e.target.files?.[0]) return;
                  addProductImage(draftProduct.id, e.target.files[0]);
                  e.target.value = "";
                }}
              />
            )}
          </div>
        </td>

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