import { redirect } from "next/navigation";
import React from "react";

const page = () => {
  return redirect("/panel/agent/dashboard");
};

export default page;
