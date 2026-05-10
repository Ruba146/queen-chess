document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("https://queen-chess.onrender.com/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    console.log("LOGIN RESPONSE:", data); // 🔥 تشخيص

    if (res.ok) {
      // 👇 يدعم أي اسم للتوكن من السيرفر
      const token = data.token || data.accessToken || data.jwt;

      if (!token) {
        document.getElementById("message").innerText = "❌ No token returned from server";
        return;
      }

      localStorage.setItem("token", token);

      console.log("TOKEN SAVED:", token); // 🔥 تأكيد

      window.location.href = "index.html";
    } else {
      document.getElementById("message").innerText = data.message || "Login failed";
    }

  } catch (err) {
    console.error(err);
    document.getElementById("message").innerText = "Server error";
  }
});