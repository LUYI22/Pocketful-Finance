"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function AuthSparkle({ size = 22 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6ZM19 14l1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" />
    </svg>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${isRegistering ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "We couldn’t complete that request. Please try again.");
        return;
      }

      router.refresh();
    } catch (requestError) {
      console.error("Authentication request failed:", requestError);
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-brand"><span className="brand-icon"><AuthSparkle size={21} /></span><span className="brand-name">pocketful<span>.</span></span></div>
      <div className="auth-layout">
        <section className="auth-story">
          <div className="auth-story-art" aria-hidden="true">
            <div className="story-orbit orbit-one" /><div className="story-orbit orbit-two" />
            <div className="story-card story-card-balance"><span>Total balance</span><strong>$34,060<span>.94</span></strong><small>↗ 4.8% this month</small></div>
            <div className="story-card story-card-goal"><span className="story-goal-icon"><AuthSparkle size={17} /></span><span><strong>A little progress, every day.</strong><small>Your goals are getting closer.</small></span></div>
            <div className="story-star star-one">✳</div><div className="story-star star-two">✦</div>
          </div>
          <p className="auth-kicker">A LITTLE MORE MINDFUL</p>
          <h1>Feel good<br />about your <em>money.</em></h1>
          <p className="auth-story-copy">A calmer, clearer way to see where you are and where you’re going.</p>
          <div className="auth-story-foot"><span className="story-avatar-stack"><i>A</i><i>J</i><i>M</i></span><span>Small steps add up.</span></div>
        </section>

        <section className="auth-panel" aria-labelledby="auth-heading">
          <div className="auth-panel-top"><span className="auth-small-mark"><AuthSparkle size={17} /></span><span>YOUR PERSONAL SPACE</span></div>
          <h2 id="auth-heading">{isRegistering ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-subheading">{isRegistering ? "Start with a username and a password between 9 and 32 characters." : "Sign in to pick up where you left off."}</p>
          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" autoComplete="username" minLength={3} maxLength={32} pattern="[A-Za-z0-9_\-]{3,32}" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" />
            <div className="password-label"><label htmlFor="password">Password</label>{isRegistering ? <span>9–32 characters</span> : null}</div>
            <input id="password" name="password" type="password" autoComplete={isRegistering ? "new-password" : "current-password"} minLength={9} maxLength={32} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
            {error ? <div className="auth-error" role="alert">{error}</div> : null}
            <button type="submit" className="auth-submit" disabled={isSubmitting}>{isSubmitting ? "Please wait..." : isRegistering ? "Create account" : "Sign in"}<span>→</span></button>
          </form>
          <p className="auth-switch">{isRegistering ? "Already have an account?" : "New to pocketful?"} <button type="button" onClick={() => { setMode(isRegistering ? "login" : "register"); setError(""); }}>{isRegistering ? "Sign in" : "Create an account"}</button></p>
          <div className="auth-divider"><span>GOOD TO KNOW</span></div>
          <div className="auth-note"><span className="auth-note-icon"><AuthSparkle size={16} /></span><p>Your account is protected with a password and secure session. Finance information in this version is sample data and isn’t tied to your account.</p></div>
          <p className="auth-privacy">By continuing, you agree to keep your password private. Never reuse a password from another account.</p>
        </section>
      </div>
      <footer className="auth-footer"><span>© 2026 pocketful</span><span>Personal finance, made a little softer.</span></footer>
    </main>
  );
}
