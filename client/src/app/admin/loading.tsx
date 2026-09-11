import { LoaderCircle } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="zbo-admin-route-loading" role="status" aria-live="polite">
      <span className="zbo-admin-route-loading-icon"><LoaderCircle className="zbo-admin-spin" aria-hidden="true" /></span>
      <div><strong>Loading secure workspace</strong><span>Preparing the latest permitted records.</span></div>
      <div className="zbo-admin-route-loading-bars" aria-hidden="true"><i /><i /><i /></div>
    </div>
  );
}
