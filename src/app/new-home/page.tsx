import { redirect } from "next/navigation";

// The redesign preview graduated to the real homepage (10/12). Keep this
// route alive so links shared during review still land somewhere.
export default function NewHomePage() {
  redirect("/");
}
