import type { FormEvent } from "react";

export interface ManualIngredientsFormProps {
  name: string;
  onNameChange: (value: string) => void;
  ingredients: string;
  onIngredientsChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  showOcrButton: boolean;
  onPhotoSelected?: (file: File) => void;
}

export function ManualIngredientsForm({
  name,
  onNameChange,
  ingredients,
  onIngredientsChange,
  onSubmit,
  showOcrButton,
  onPhotoSelected,
}: ManualIngredientsFormProps) {
  function handleFileChange(e: FormEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file) {
      onPhotoSelected?.(file);
    }
  }

  return (
    <form className="manual-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="manual-name" className="field-label">Nom du produit</label>
        <input
          id="manual-name"
          className="field-input"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="manual-ingredients" className="field-label">Ingrédients</label>
        <textarea
          id="manual-ingredients"
          className="field-input"
          value={ingredients}
          onChange={(e) => onIngredientsChange(e.target.value)}
        />
        {showOcrButton && (
          <label htmlFor="ocr-photo" className="text-button">
            Photographier pour remplir
            <input
              id="ocr-photo"
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
      <button type="submit" className="primary-button">Valider</button>
    </form>
  );
}
