import { permanentRedirect } from "next/navigation";

export default function RegisterClinicRedirect() {
  permanentRedirect("/cooperation/clinic");
}
