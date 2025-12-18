import styles from "../../pages/Admin/Admin.module.css";

type FormInputProps = {
    labelName: string,
    labelNameUnit?: string,
    inputName: string,
    valueForInput: string,
    inputExamples?: string,
    handleFormTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>void,
}

export function FormInputTypeText({labelName, labelNameUnit, inputName, valueForInput, inputExamples, handleFormTextChange}:FormInputProps){
    return (
        <>
            <label className={styles.label}>{labelName} {labelNameUnit && <span>{labelNameUnit}</span>}</label>
            <input
                type="text"
                value={valueForInput}
                onChange={handleFormTextChange}
                placeholder={inputExamples ? inputExamples : ""}
                name={inputName}
                required
                className={styles.formInput}
            />
        </>
    )
}