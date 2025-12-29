import { CustomizableProductPage } from "../CustomizableProductPage/CustomizableProductPage";

export function ShopProducts(){
    return (
        <CustomizableProductPage 
            dbProductRouteName="AllProducts"
            pageName="Shop"
            urlNameSingleProductPage=""
        />
    ) 
}