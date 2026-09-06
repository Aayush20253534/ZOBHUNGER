import { getDataMode } from "@/services/adapters";

export function FormModeNotice() {
  return (
    <div className="zb-form-intro">
      {getDataMode() === "mock" && (
        <div className="zb-form-preview-note">
          <span className="zb-chip">Preview form</span>
          <p>Use sample details to try the form. Nothing is sent or saved.</p>
        </div>
      )}
      <p className="zb-field-note">Fields marked with * are required.</p>
    </div>
  );
}
