import type { FormEvent } from "react";

export interface ManualIngredientsFormProps {
  name: string;
  onNameChange: (value: string) => void;
  ingredients: string;
  onIngredientsChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  showOcrButton: boolean;
  onOcrRequest?: () => void;
}

export function ManualIngredientsForm({
  name,
  onNameChange,
  ingredients,
  onIngredientsChange,
  onSubmit,
  showOcrButton,
  onOcrRequest,
}: ManualIngredientsFormProps) {
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
          <button type="button" className="text-button" onClick={onOcrRequest}>
            Photographier pour remplir
          </button>
        )}
      </div>
      <button type="submit" className="primary-button">Valider</button>
    </form>
  );
}
