import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const users = [
      { email: "admin@school.edu", password: "Admin@123456", fullName: "Nguyễn Văn Admin", role: "admin" as const },
      { email: "teacher1@school.edu", password: "Teacher@123456", fullName: "Trần Thị Giảng Viên", role: "teacher" as const, teacherCode: "GV001", department: "Công nghệ thông tin" },
      { email: "teacher2@school.edu", password: "Teacher@123456", fullName: "Lê Văn Dạy", role: "teacher" as const, teacherCode: "GV002", department: "Toán học" },
      { email: "student1@school.edu", password: "Student@123456", fullName: "Phạm Minh Sinh Viên", role: "student" as const, studentCode: "SV001", department: "Công nghệ thông tin" },
      { email: "student2@school.edu", password: "Student@123456", fullName: "Hoàng Thị Học", role: "student" as const, studentCode: "SV002", department: "Toán học" },
      { email: "student3@school.edu", password: "Student@123456", fullName: "Vũ Đức Tài", role: "student" as const, studentCode: "SV003", department: "Công nghệ thông tin" },
    ];

    const createdUsers: Record<string, string> = {};

    // Create auth users
    for (const u of users) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });
      if (error && !error.message.includes("already been registered")) {
        console.error(`Error creating ${u.email}:`, error.message);
        continue;
      }
      if (data?.user) {
        createdUsers[u.email] = data.user.id;
      } else {
        // User exists, fetch id
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find((x: any) => x.email === u.email);
        if (existing) createdUsers[u.email] = existing.id;
      }
    }

    // Assign roles
    for (const u of users) {
      const userId = createdUsers[u.email];
      if (!userId) continue;
      await supabase.from("user_roles").upsert(
        { user_id: userId, role: u.role },
        { onConflict: "user_id,role" }
      );
    }

    // Create teacher records
    const teacherIds: Record<string, string> = {};
    for (const u of users.filter((x) => x.role === "teacher")) {
      const userId = createdUsers[u.email];
      if (!userId) continue;
      const { data } = await supabase
        .from("teachers")
        .upsert({ user_id: userId, full_name: u.fullName, teacher_code: (u as any).teacherCode, department: (u as any).department }, { onConflict: "user_id" })
        .select("id")
        .single();
      if (data) teacherIds[u.email] = data.id;
    }

    // Create student records
    const studentIds: Record<string, string> = {};
    for (const u of users.filter((x) => x.role === "student")) {
      const userId = createdUsers[u.email];
      if (!userId) continue;
      const { data } = await supabase
        .from("students")
        .upsert({ user_id: userId, full_name: u.fullName, student_code: (u as any).studentCode, department: (u as any).department }, { onConflict: "user_id" })
        .select("id")
        .single();
      if (data) studentIds[u.email] = data.id;
    }

    // Semesters
    const { data: sem1 } = await supabase
      .from("semesters")
      .upsert({ name: "Học kỳ 1 - 2025-2026", start_date: "2025-09-01", end_date: "2026-01-15" }, { onConflict: "name" })
      .select("id")
      .single();
    const { data: sem2 } = await supabase
      .from("semesters")
      .upsert({ name: "Học kỳ 2 - 2025-2026", start_date: "2026-02-01", end_date: "2026-06-15" }, { onConflict: "name" })
      .select("id")
      .single();

    // Courses
    const coursesData = [
      { course_code: "CS101", course_name: "Nhập môn Lập trình", credits: 3, department: "Công nghệ thông tin" },
      { course_code: "CS201", course_name: "Cấu trúc Dữ liệu", credits: 4, department: "Công nghệ thông tin" },
      { course_code: "MATH101", course_name: "Giải tích 1", credits: 3, department: "Toán học" },
      { course_code: "MATH201", course_name: "Đại số tuyến tính", credits: 3, department: "Toán học" },
      { course_code: "ENG101", course_name: "Tiếng Anh cơ bản", credits: 2, department: "Ngoại ngữ" },
    ];
    const courseIds: Record<string, string> = {};
    for (const c of coursesData) {
      const { data } = await supabase.from("courses").upsert(c, { onConflict: "course_code" }).select("id").single();
      if (data) courseIds[c.course_code] = data.id;
    }

    // Classes
    if (sem1 && Object.keys(courseIds).length > 0) {
      const classesData = [
        { class_name: "CS101-01", course_id: courseIds["CS101"], teacher_id: teacherIds["teacher1@school.edu"], semester_id: sem1.id, max_students: 40 },
        { class_name: "CS201-01", course_id: courseIds["CS201"], teacher_id: teacherIds["teacher1@school.edu"], semester_id: sem1.id, max_students: 35 },
        { class_name: "MATH101-01", course_id: courseIds["MATH101"], teacher_id: teacherIds["teacher2@school.edu"], semester_id: sem1.id, max_students: 50 },
        { class_name: "ENG101-01", course_id: courseIds["ENG101"], teacher_id: null, semester_id: sem1.id, max_students: 30 },
      ];

      const classIds: Record<string, string> = {};
      for (const cl of classesData) {
        if (!cl.course_id || !cl.semester_id) continue;
        const { data } = await supabase.from("classes").upsert(cl, { onConflict: "class_name" }).select("id").single();
        if (data) classIds[cl.class_name] = data.id;
      }

      // Schedules
      const schedules = [
        { class_id: classIds["CS101-01"], day_of_week: "Monday", start_time: "08:00", end_time: "10:00", room: "A101" },
        { class_id: classIds["CS101-01"], day_of_week: "Wednesday", start_time: "08:00", end_time: "10:00", room: "A101" },
        { class_id: classIds["CS201-01"], day_of_week: "Tuesday", start_time: "10:00", end_time: "12:00", room: "B202" },
        { class_id: classIds["MATH101-01"], day_of_week: "Thursday", start_time: "13:00", end_time: "15:00", room: "C303" },
      ];
      for (const s of schedules) {
        if (s.class_id) await supabase.from("schedules").upsert(s, { onConflict: "class_id,day_of_week" });
      }

      // Enrollments
      const enrollments: Array<{ class_id: string; student_id: string }> = [];
      if (classIds["CS101-01"] && studentIds["student1@school.edu"]) enrollments.push({ class_id: classIds["CS101-01"], student_id: studentIds["student1@school.edu"] });
      if (classIds["CS201-01"] && studentIds["student1@school.edu"]) enrollments.push({ class_id: classIds["CS201-01"], student_id: studentIds["student1@school.edu"] });
      if (classIds["MATH101-01"] && studentIds["student2@school.edu"]) enrollments.push({ class_id: classIds["MATH101-01"], student_id: studentIds["student2@school.edu"] });
      if (classIds["CS101-01"] && studentIds["student3@school.edu"]) enrollments.push({ class_id: classIds["CS101-01"], student_id: studentIds["student3@school.edu"] });

      for (const e of enrollments) {
        const { data } = await supabase.from("enrollments").upsert(e, { onConflict: "class_id,student_id" }).select("id").single();
        if (data) {
          // Add grades
          await supabase.from("grades").upsert({ enrollment_id: data.id, midterm: Math.floor(Math.random() * 4 + 6), final: Math.floor(Math.random() * 4 + 6) }, { onConflict: "enrollment_id" });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Seed data created successfully",
        accounts: users.map((u) => ({ email: u.email, password: u.password, role: u.role })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
