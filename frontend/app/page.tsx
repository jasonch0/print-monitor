import Table from "@/components/Table";

export default function Home() {
  return (
    <main className="py-4">
      <div className="mb-2 px-4">
        <h1 className="text-lg font-semibold">BC Print Monitor</h1>
        <p className="text-xs text-gray-500">built by Jason Cho ’26</p>
      </div>
      <Table />
    </main>
  );
}
