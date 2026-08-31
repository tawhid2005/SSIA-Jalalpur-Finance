import { db, generateStudentId } from './src/db.js';

async function test() {
  try {
    console.log("Generating ID...");
    const id = await generateStudentId();
    console.log("Generated ID:", id);

    console.log("Adding student...");
    await db.students.add({ id, name: "Test Student" });
    console.log("Student added!");

  } catch(e) {
    console.error("TEST FAILED:", e);
  }
}
test();
