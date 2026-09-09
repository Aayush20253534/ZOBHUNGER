import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PlacementCellLoginAccess } from "@/components/placement/PlacementCellLoginAccess";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/portal.css";

export const metadata={...getPageMetadata("Institution Partner Login","Secure portal access for approved ZOBHUNGER Placement Cell & Institution partners.","/placement-cell-login"),robots:{index:false,follow:false}};
export default function Page(){return <div className="zb-portal-page zb-auth-page zb-auth-page--placement"><Breadcrumbs items={[{label:"Home",href:"/"},{label:"Placement Cell & Institution Partnership",href:"/placement-cell-partnership"},{label:"Login"}]}/><PlacementCellLoginAccess/></div>}
