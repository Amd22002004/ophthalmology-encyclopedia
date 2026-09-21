import { permanentRedirect } from "next/navigation";

export default function RegisterDoctorRedirect() {
  permanentRedirect("/cooperation/doctor");
}
