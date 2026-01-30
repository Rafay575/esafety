import { useParams } from "react-router-dom";
import CreateUserForm from "./CreateUserForm"; // your component

export default function UsersUpsertPage() {
  const { id } = useParams();          // /users/add  -> id undefined
  const userId = id ? Number(id) : undefined;

  return (
    <div className="space-y-4">
      <CreateUserForm userId={userId} />
    </div>
  );
}
