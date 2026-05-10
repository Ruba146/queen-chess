document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  const message = document.getElementById("message");

  // 🧠 Validation
  if (password !== confirmPassword) {
    message.innerText = "❌ Passwords do not match";
    return;
  }

  if (password.length < 6) {
    message.innerText = "❌ Password must be at least 6 characters";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        email,
        password
      })
    });

    const data = await res.json();

    if (res.ok) {
      message.innerText = "✅ Account created successfully!";

      // 🔥 تجربة مستخدم أفضل
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);

    } else {
      message.innerText =
        data.message || data.error || "Register failed ❌";
    }

  } catch (err) {
    console.error(err);
    message.innerText = "🚨 Server error";
  }
});