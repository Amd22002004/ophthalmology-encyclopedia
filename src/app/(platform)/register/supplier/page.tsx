import { permanentRedirect } from "next/navigation";

export default function RegisterSupplierRedirect() {
  permanentRedirect("/cooperation/partner");
}
