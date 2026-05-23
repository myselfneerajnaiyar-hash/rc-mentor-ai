import { redirect } from "next/navigation"

export default function SavedSession({ params }) {

  redirect(`/birbal-v2?session=${params.id}`)
}