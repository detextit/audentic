import { auth } from "@clerk/nextjs/server";
import LandingPage from "./landing/page";
import Home from "./Home";

export default async function Page() {
  const { userId } = await auth();

  // If user is signed in, show home dashboard, otherwise show landing page
  return userId ? <Home /> : <LandingPage />;
}
