import { useEffect, useState } from "react";
import { FaPencilAlt } from "react-icons/fa";
import { InlineEditableField } from "./EditableProductCard"; 

type EditYouTubeVideoIdProps = {
    initialVideoId: string;
    setYouTubeVideoId: (id: string) => void;
    youTubeError: string;
    setYouTubeError: (err: string) => void;
};


export function EditYouTubeVideoId({initialVideoId, setYouTubeVideoId, youTubeError, setYouTubeError}:EditYouTubeVideoIdProps) {
    const [temporaryVideoId, setTemporaryVideoId] = useState<string>("");
    const [isEditing, setIsEditing] = useState<boolean>(false);

    useEffect(()=>{
        if (initialVideoId) setTemporaryVideoId(initialVideoId);
    },[initialVideoId]);

    async function handleSubmit(){
        try {
            const response = await fetch(`http://localhost:5000/api/admin/AwsS3/UpdateYouTubeVideoId`,{
                method: "POST",
                headers: {
                "Authorization": "Bearer " + localStorage.getItem("jwt"),
                "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    videoid: temporaryVideoId
                })
            });

            if (!response.ok) throw new Error("Unable to update YouTube video ID");

            const data:Partial<{message:string, error:string}> = await response.json();
            if (data.error) throw new Error("Server failure when updating video ID");

            setIsEditing(false);
            setYouTubeVideoId(initialVideoId)

        } catch (err) {
            if (err instanceof Error) setYouTubeError(err.message);
        }
    }

    function handleCancel(){
        setIsEditing(false);
        setTemporaryVideoId(initialVideoId);
    }

    return (
        <div>
            <h2>Edit YouTube Video ID</h2>
            <p>{youTubeError}</p>
            <InlineEditableField
                value={temporaryVideoId}
                editing={isEditing}
                onChange={(val) => setTemporaryVideoId(val)}
            />
            {isEditing ? (
                <>
                    <button onClick={()=>handleSubmit()}>Submit</button>
                    <button onClick={()=>handleCancel()}>Cancel</button>
                </>
            ):
            <button onClick={()=>setIsEditing(true)}><FaPencilAlt /></button>
            }
        </div>
    );
}