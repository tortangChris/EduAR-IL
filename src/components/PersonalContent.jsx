import React, { useRef, useState } from "react";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PersonalContent = () => {
  const [name, setName] = useState("User's Name");
  const [email, setEmail] = useState("user123@gmail.com");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [image, setImage] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleSaveClick = () => {
    setShowSaveModal(true);
  };

  const handleConfirmSave = () => {
    setShowSaveModal(false);
    console.log("Information confirmed:", { name, email, image });
    navigate("/settings");
  };

  const handleCancelSave = () => {
    setShowSaveModal(false);
  };

  const handleDiscardClick = () => {
    setShowDiscardModal(true);
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setName("User's Name");
    setEmail("user123@gmail.com");
    setImage(null);
    console.log("Changes discarded.");
    navigate("/settings");
  };

  const handleCancelDiscard = () => {
    setShowDiscardModal(false);
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      setImage(imgUrl);
    }
  };

  return (
    <>
      <div className="bg-base-200 rounded-2xl shadow-xl p-8 max-w-full mx-auto mt-10 space-y-6">
        <div className="flex justify-center">
          <div className="avatar cursor-pointer" onClick={handleImageClick}>
            <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={
                  image || "https://via.placeholder.com/150?text=Upload+Image"
                }
                alt="User"
              />
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Gmail</span>
          </label>
          <input
            type="email"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="pt-4 space-y-2">
          <button
            className="btn btn-success gap-2 w-full justify-center"
            onClick={handleSaveClick}
          >
            <Save size={18} /> Save
          </button>
          <button
            className="btn btn-outline btn-error gap-2 w-full justify-center"
            onClick={handleDiscardClick}
          >
            Discard Changes
          </button>
        </div>
      </div>

      {showSaveModal && (
        <dialog id="confirm_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Update</h3>
            <p className="py-4">Are you sure you want to save the changes?</p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={handleCancelSave}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleConfirmSave}>
                Confirm
              </button>
            </div>
          </div>
        </dialog>
      )}

      {showDiscardModal && (
        <dialog id="discard_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Discard Changes</h3>
            <p className="py-4">
              Are you sure you want to discard all changes?
            </p>
            <div className="modal-action">
              <button className="btn btn-outline" onClick={handleCancelDiscard}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleConfirmDiscard}>
                Discard Changes
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default PersonalContent;
