import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";
const BACKEND_URL = "http://127.0.0.1:8000";

// =========================================================
// PHOTO URL HELPER
// =========================================================

function getPhotoUrl(photoPath) {
  if (!photoPath) return null;

  const normalizedPath = String(photoPath)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://")
  ) {
    return normalizedPath;
  }

  return `${BACKEND_URL}/${normalizedPath}`;
}

// =========================================================
// MAIN APP
// =========================================================

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [missingPersons, setMissingPersons] = useState([]);
  const [publicReports, setPublicReports] = useState([]);

  // ---------------- PUBLIC DASHBOARD ----------------

  const [publicDashboard, setPublicDashboard] = useState(null);

  const [publicStats, setPublicStats] = useState({
    total_reports: 0,
    pending_reports: 0,
    approved_reports: 0,
    rejected_reports: 0,
  });

  const [myReports, setMyReports] = useState([]);

  // ---------------- PUBLIC ACCORDION ----------------

  const [openPublicSection, setOpenPublicSection] = useState(null);

  // ---------------- FACE MATCHING ----------------

  const [faceMatchPhoto, setFaceMatchPhoto] = useState(null);

  const [faceMatchResults, setFaceMatchResults] = useState(null);

  const [faceMatchLoading, setFaceMatchLoading] = useState(false);

  const [faceMatchPreviewUrl, setFaceMatchPreviewUrl] = useState(null);

const [faceMatchImageDimensions, setFaceMatchImageDimensions] = useState({
  naturalWidth: 0,
  naturalHeight: 0,
  width: 0,
  height: 0,
});

  // ---------------- CASE SEARCH / FILTER ----------------

  const [caseSearch, setCaseSearch] = useState("");
  const [caseStatusFilter, setCaseStatusFilter] = useState("all");
  const [caseGenderFilter, setCaseGenderFilter] = useState("all");

  // ---------------- CASE DETAILS ----------------

  const [selectedCase, setSelectedCase] = useState(null);

  // ---------------- ADMIN CREATE USER ----------------

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("public");
  const [showCreateUser, setShowCreateUser] = useState(false);

  // ---------------- ADMIN ROLE MANAGEMENT ----------------

  const [userRoleSelections, setUserRoleSelections] = useState({});
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // ---------------- ADMIN ACCORDION ----------------

  const [openAdminSection, setOpenAdminSection] = useState(null);

  // ---------------- INVESTIGATOR ACCORDION ----------------

  const [
    openInvestigatorSection,
    setOpenInvestigatorSection,
  ] = useState(null);

  // ---------------- MISSING PERSON FORM ----------------

  const [missingName, setMissingName] = useState("");
  const [missingAge, setMissingAge] = useState("");
  const [missingGender, setMissingGender] = useState("Male");

  const [missingDescription, setMissingDescription] = useState("");

  const [lastSeenLocation, setLastSeenLocation] = useState("");

  const [lastSeenDate, setLastSeenDate] = useState("");

  const [missingPhoto, setMissingPhoto] = useState(null);

  const [showMissingForm, setShowMissingForm] = useState(false);

  // ---------------- PUBLIC REPORT FORM ----------------

  const [reportName, setReportName] = useState("");
  const [reportAge, setReportAge] = useState("");
  const [reportGender, setReportGender] = useState("Male");

  const [reportDescription, setReportDescription] = useState("");

  const [reportLocation, setReportLocation] = useState("");

  const [reportDate, setReportDate] = useState("");
  const [reportPhoto, setReportPhoto] = useState(null);

  const [showReportForm, setShowReportForm] = useState(false);

  const role = localStorage.getItem("role");

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      localStorage.setItem(
        "role",
        response.data.role
      );

      setLoggedIn(true);
      setEmail("");
      setPassword("");
      setMessage("Login successful!");
    } catch (error) {
      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail.map((item) => item.msg).join(", ")
        );
      } else {
        setMessage(
          typeof detail === "string"
            ? detail
            : "Login failed"
        );
      }
    }
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post(
        `${API_URL}/auth/register`,
        {
          name,
          email,
          password,
          role: "public",
        }
      );

      setName("");
      setEmail("");
      setPassword("");
      setAuthMode("login");

      setMessage(
        "Registration successful! Please login."
      );
    } catch (error) {
      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail.map((item) => item.msg).join(", ")
        );
      } else {
        setMessage(
          typeof detail === "string"
            ? detail
            : "Registration failed"
        );
      }
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");

    setLoggedIn(false);

    setUsers([]);
    setMissingPersons([]);
    setPublicReports([]);
    setPublicDashboard(null);
    setMyReports([]);

    setSelectedCase(null);
    setUserRoleSelections({});
    setUpdatingUserId(null);

    setOpenAdminSection(null);
    setOpenInvestigatorSection(null);
    setOpenPublicSection(null);

    setFaceMatchPhoto(null);
    setFaceMatchResults(null);
    setFaceMatchLoading(false);

    setMessage("");
  };

  // =========================================================
  // FACE MATCHING
  // =========================================================

  const handleFaceMatching = async (e) => {
    e.preventDefault();

    setMessage("");
    setFaceMatchResults(null);

    if (!faceMatchPhoto) {
      setMessage(
        "Please select a photograph to search."
      );
      return;
    }

    try {
      setFaceMatchLoading(true);

      const formData = new FormData();

      formData.append(
        "photo",
        faceMatchPhoto
      );

      const response = await axios.post(
        `${API_URL}/face-matching/match`,
        formData
      );

      setFaceMatchResults(response.data);

      setMessage(
        response.data.match_found
          ? "Potential match found!"
          : "No matching person found above the current threshold."
      );
    } catch (error) {
      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map((item) => item.msg)
            .join(", ")
        );
      } else {
        setMessage(
          typeof detail === "string"
            ? detail
            : "Face matching failed. Please try another photograph."
        );
      }

      setFaceMatchResults(null);
    } finally {
      setFaceMatchLoading(false);
    }
  };

  const clearFaceMatching = () => {
    setFaceMatchPhoto(null);
    setFaceMatchResults(null);
    setFaceMatchLoading(false);
    setMessage("");

    const fileInput =
      document.getElementById(
        "face-match-photo"
      );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  useEffect(() => {
    if (!faceMatchPhoto) {
      setFaceMatchPreviewUrl(null);
  
      setFaceMatchImageDimensions({
        naturalWidth: 0,
        naturalHeight: 0,
        width: 0,
        height: 0,
      });
  
      return;
    }
  
    const url = URL.createObjectURL(faceMatchPhoto);
  
    setFaceMatchPreviewUrl(url);
  
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [faceMatchPhoto]);
  
  const handleFaceMatchImageLoad = (e) => {
    const img = e.currentTarget;
  
    setFaceMatchImageDimensions({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: img.clientWidth,
      height: img.clientHeight,
    });
  };

  // =========================================================
  // UPDATE CASE STATUS
  // =========================================================

  const handleCaseStatusUpdate = async (
    caseId,
    newStatus
  ) => {
    setMessage("");

    try {
      const token =
        localStorage.getItem("access_token");

      await axios.put(
        `${API_URL}/missing-persons/${caseId}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        `Case #${caseId} status updated to ${newStatus} successfully!`
      );

      await fetchMissingPersons();

      setSelectedCase((currentCase) =>
        currentCase &&
        currentCase.id === caseId
          ? {
              ...currentCase,
              status: newStatus,
            }
          : currentCase
      );
    } catch (error) {
      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map((item) => item.msg)
            .join(", ")
        );
      } else {
        setMessage(
          typeof detail === "string"
            ? detail
            : "Failed to update case status"
        );
      }
    }
  };

  // =========================================================
  // FETCH USERS
  // =========================================================

  const fetchUsers = async () => {
    try {
      const token =
        localStorage.getItem("access_token");

      const response = await axios.get(
        `${API_URL}/users/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(response.data);

      const roleSelections = {};

      response.data.forEach((user) => {
        roleSelections[user.id] =
          user.role;
      });

      setUserRoleSelections(
        roleSelections
      );
    } catch (error) {
      console.error(
        "Failed to fetch users:",
        error
      );
    }
  };

  // =========================================================
  // UPDATE USER ROLE
  // =========================================================

  const handleUpdateUserRole = async (
    userId
  ) => {
    setMessage("");

    const selectedRole =
      userRoleSelections[userId];

    if (!selectedRole) {
      setMessage("Please select a role.");
      return;
    }

    try {
      const token =
        localStorage.getItem("access_token");

      setUpdatingUserId(userId);

      await axios.put(
        `${API_URL}/users/${userId}/role`,
        {
          role: selectedRole,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchUsers();

      setMessage(
        "User role updated successfully!"
      );
    } catch (error) {
      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map((item) => item.msg)
            .join(", ")
        );
      } else {
        setMessage(
          typeof detail === "string"
            ? detail
            : "Failed to update user role"
        );
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  // =========================================================
  // CREATE USER
  // =========================================================

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token =
        localStorage.getItem("access_token");

      await axios.post(
        `${API_URL}/users/create`,
        {
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("public");
      setShowCreateUser(false);

      await fetchUsers();

      setMessage(
        "User created successfully!"
      );
    } catch (error) {
      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map((item) => item.msg)
            .join(", ")
        );
      } else {
        setMessage(
          typeof detail === "string"
            ? detail
            : "Failed to create user"
        );
      }
    }
  };

  // =========================================================
  // FETCH MISSING PERSONS
  // =========================================================

  const fetchMissingPersons = async () => {
    try {
      const token =
        localStorage.getItem("access_token");

      const response = await axios.get(
        `${API_URL}/missing-persons/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMissingPersons(
        response.data
      );
    } catch (error) {
      console.error(
        "Failed to fetch missing persons:",
        error
      );
    }
  };

  // =========================================================
  // FETCH PUBLIC REPORTS
  // =========================================================

  const fetchPublicReports = async () => {
    try {
      const token =
        localStorage.getItem("access_token");

      const response = await axios.get(
        `${API_URL}/public-reports/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPublicReports(
        response.data
      );
    } catch (error) {
      console.error(
        "Failed to fetch public reports:",
        error
      );
    }
  };

  // =========================================================
  // FETCH PUBLIC DASHBOARD
  // =========================================================

  const fetchPublicDashboard = async () => {
    try {
      const token =
        localStorage.getItem("access_token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        dashboardResponse,
        statsResponse,
        reportsResponse,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/dashboard/public`,
          { headers }
        ),

        axios.get(
          `${API_URL}/public-reports/my-stats`,
          { headers }
        ),

        axios.get(
          `${API_URL}/public-reports/my-reports`,
          { headers }
        ),
      ]);

      setPublicDashboard(
        dashboardResponse.data
      );

      setPublicStats(
        statsResponse.data
      );

      setMyReports(
        reportsResponse.data
      );
    } catch (error) {
      console.error(
        "Failed to fetch public dashboard:",
        error
      );
    }
  };

  // =========================================================
  // APPROVE / REJECT PUBLIC REPORT
  // =========================================================

  const handleReportAction = async (
    reportId,
    action
  ) => {
    setMessage("");

    try {
      const token =
        localStorage.getItem("access_token");

      await axios.put(
        `${API_URL}/public-reports/${reportId}/${action}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        `Report ${
          action === "approve"
            ? "approved"
            : "rejected"
        } successfully!`
      );

      await fetchPublicReports();
      await fetchMissingPersons();
    } catch (error) {
      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map((item) => item.msg)
            .join(", ")
        );
      } else {
        setMessage(
          typeof detail === "string"
            ? detail
            : `Failed to ${action} report`
        );
      }
    }
  };

  // =========================================================
  // CREATE MISSING PERSON
  // =========================================================

  const handleCreateMissingPerson =
    async (e) => {
      e.preventDefault();
      setMessage("");

      if (!missingPhoto) {
        setMessage(
          "Please select a photo."
        );
        return;
      }

      try {
        const token =
          localStorage.getItem(
            "access_token"
          );

        const formData =
          new FormData();

        formData.append(
          "name",
          missingName
        );

        formData.append(
          "age",
          missingAge
        );

        formData.append(
          "gender",
          missingGender
        );

        formData.append(
          "description",
          missingDescription
        );

        formData.append(
          "last_seen_location",
          lastSeenLocation
        );

        formData.append(
          "last_seen_date",
          new Date(lastSeenDate)
            .toISOString()
            .slice(0, 19)
        );

        formData.append(
          "photo",
          missingPhoto
        );

        await axios.post(
          `${API_URL}/missing-persons/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMissingName("");
        setMissingAge("");
        setMissingGender("Male");
        setMissingDescription("");
        setLastSeenLocation("");
        setLastSeenDate("");
        setMissingPhoto(null);
        setShowMissingForm(false);

        const fileInput =
          document.getElementById(
            "missing-photo"
          );

        if (fileInput) {
          fileInput.value = "";
        }

        await fetchMissingPersons();

        setMessage(
          "Missing person case created successfully!"
        );
      } catch (error) {
        const detail =
          error.response?.data?.detail;

        if (Array.isArray(detail)) {
          setMessage(
            detail
              .map((item) => item.msg)
              .join(", ")
          );
        } else {
          setMessage(
            typeof detail === "string"
              ? detail
              : "Failed to create missing person case"
          );
        }
      }
    };

  // =========================================================
  // PUBLIC REPORT
  // =========================================================

  const handlePublicReport = async (
    e
  ) => {
    e.preventDefault();
    setMessage("");

    if (!reportPhoto) {
      setMessage(
        "Please select a photo."
      );
      return;
    }

    try {
      const token =
        localStorage.getItem(
          "access_token"
        );

      const formData =
        new FormData();

      formData.append(
        "missing_person_name",
        reportName
      );

      formData.append(
        "age",
        reportAge
      );

      formData.append(
        "gender",
        reportGender
      );

      formData.append(
        "description",
        reportDescription
      );

      formData.append(
        "last_seen_location",
        reportLocation
      );

      formData.append(
        "last_seen_date",
        new Date(reportDate)
          .toISOString()
          .slice(0, 19)
      );

      formData.append(
        "photo",
        reportPhoto
      );

      const response =
        await axios.post(
          `${API_URL}/public-reports/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setReportName("");
      setReportAge("");
      setReportGender("Male");
      setReportDescription("");
      setReportLocation("");
      setReportDate("");
      setReportPhoto(null);
      setShowReportForm(false);

      const fileInput =
        document.getElementById(
          "report-photo"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      setMessage(
        `Report submitted successfully! Report ID: ${response.data.report_id}. Status: ${response.data.status}`
      );

      await fetchPublicDashboard();
    } catch (error) {
      const detail =
        error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setMessage(
          detail
            .map((item) => item.msg)
            .join(", ")
        );
      } else {
        setMessage(
          typeof detail === "string"
            ? detail
            : "Failed to submit report"
        );
      }
    }
  };

  // =========================================================
  // FILTERED CASES
  // =========================================================

  const filteredCases =
    missingPersons.filter(
      (person) => {
        const search =
          caseSearch
            .toLowerCase()
            .trim();

        const matchesSearch =
          search === "" ||
          person.name
            ?.toLowerCase()
            .includes(search) ||
          person.last_seen_location
            ?.toLowerCase()
            .includes(search);

        const matchesStatus =
          caseStatusFilter ===
            "all" ||
          person.status ===
            caseStatusFilter;

        const matchesGender =
          caseGenderFilter ===
            "all" ||
          person.gender ===
            caseGenderFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesGender
        );
      }
    );

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    if (role === "admin") {
      fetchUsers();
      fetchMissingPersons();
      fetchPublicReports();
    }

    if (role === "investigator") {
      fetchMissingPersons();
      fetchPublicReports();
    }

    if (role === "public") {
      fetchPublicDashboard();
    }
  }, [loggedIn, role]);

  // =========================================================
  // LOGIN / REGISTER
  // =========================================================

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

          <h1 className="text-3xl font-bold text-center mb-2">
            Finding Missing Person
          </h1>

          <p className="text-center text-gray-500 mb-6">
            AI-Powered Missing Person Identification
          </p>

          <div className="flex mb-6 border rounded-lg overflow-hidden">

            <button
              className={`w-1/2 py-2 ${
                authMode === "login"
                  ? "bg-blue-600 text-white"
                  : "bg-white"
              }`}
              onClick={() => {
                setAuthMode("login");
                setMessage("");
              }}
            >
              Login
            </button>

            <button
              className={`w-1/2 py-2 ${
                authMode === "register"
                  ? "bg-blue-600 text-white"
                  : "bg-white"
              }`}
              onClick={() => {
                setAuthMode("register");
                setMessage("");
              }}
            >
              Register
            </button>

          </div>

          {message && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
              {message}
            </div>
          )}

          {authMode === "login" ? (
            <form
              onSubmit={handleLogin}
              className="space-y-4"
            >

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
                required
              />

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg"
              >
                Login
              </button>

              <div className="text-center bg-gray-50 border rounded-lg p-3">

                <p className="text-sm text-gray-600">
                  For Admin or Investigator access,
                  please contact the System
                  Administrator.
                </p>

              </div>

            </form>
          ) : (
            <form
              onSubmit={handleRegister}
              className="space-y-4"
            >

              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
                required
              />

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg"
              >
                Register
              </button>

              <div className="text-center bg-gray-50 border rounded-lg p-3">

                <p className="text-sm text-gray-600">
                  Registration creates a Public
                  account only.
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  For Admin or Investigator access,
                  please contact the System
                  Administrator.
                </p>

              </div>

            </form>
          )}

        </div>

      </div>
    );
  }

  // =========================================================
  // ADMIN DASHBOARD
  // =========================================================

  if (role === "admin") {
    return (
      <div className="min-h-screen bg-gray-100">

        <header className="bg-white shadow px-8 py-4 flex justify-between items-center">

          <div>
            <h1 className="text-2xl font-bold">
              Admin Dashboard
            </h1>

            <p className="text-gray-500">
              Finding Missing Person Using AI
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>

        </header>

        <main className="p-8">

          {message && (
            <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
              {message}
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-6 mb-8">

            <DashboardCard
              title="Total Cases"
              value={
                missingPersons.length
              }
            />

            <DashboardCard
              title="Active Cases"
              value={
                missingPersons.filter(
                  (person) =>
                    person.status ===
                    "active"
                ).length
              }
            />

            <DashboardCard
              title="Registered Users"
              value={users.length}
            />

            <DashboardCard
              title="Public Reports"
              value={
                publicReports.length
              }
            />

          </div>

          <AccordionSection
            title="Admin Controls"
            icon="⚙️"
            sectionKey="controls"
            openSection={
              openAdminSection
            }
            setOpenSection={
              setOpenAdminSection
            }
          >

            <div className="p-6">

              <div className="flex flex-wrap gap-3">

                <button
                  onClick={() => {
                    setShowMissingForm(
                      !showMissingForm
                    );
                    setShowCreateUser(
                      false
                    );
                    setMessage("");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {showMissingForm
                    ? "✕ Close Missing Person Form"
                    : "+ Add Missing Person"}
                </button>

                <button
                  onClick={() => {
                    setShowCreateUser(
                      !showCreateUser
                    );
                    setShowMissingForm(
                      false
                    );
                    setMessage("");
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  {showCreateUser
                    ? "✕ Close Create User Form"
                    : "+ Create User"}
                </button>

              </div>

            </div>

            {showMissingForm && (
              <div className="px-6 pb-6">

                <MissingPersonForm
                  missingName={
                    missingName
                  }
                  setMissingName={
                    setMissingName
                  }
                  missingAge={
                    missingAge
                  }
                  setMissingAge={
                    setMissingAge
                  }
                  missingGender={
                    missingGender
                  }
                  setMissingGender={
                    setMissingGender
                  }
                  missingDescription={
                    missingDescription
                  }
                  setMissingDescription={
                    setMissingDescription
                  }
                  lastSeenLocation={
                    lastSeenLocation
                  }
                  setLastSeenLocation={
                    setLastSeenLocation
                  }
                  lastSeenDate={
                    lastSeenDate
                  }
                  setLastSeenDate={
                    setLastSeenDate
                  }
                  setMissingPhoto={
                    setMissingPhoto
                  }
                  handleSubmit={
                    handleCreateMissingPerson
                  }
                  title="Add Missing Person"
                />

              </div>
            )}

            {showCreateUser && (
              <div className="px-6 pb-6">

                <form
                  onSubmit={
                    handleCreateUser
                  }
                  className="bg-gray-50 border rounded-xl p-6 space-y-4"
                >

                  <h2 className="text-xl font-bold">
                    Create User
                  </h2>

                  <p className="text-sm text-gray-500">
                    Only an authorized Admin can
                    create Admin or Investigator
                    accounts.
                  </p>

                  <input
                    type="text"
                    placeholder="Full Name"
                    value={
                      newUserName
                    }
                    onChange={(e) =>
                      setNewUserName(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3 bg-white"
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={
                      newUserEmail
                    }
                    onChange={(e) =>
                      setNewUserEmail(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3 bg-white"
                    required
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={
                      newUserPassword
                    }
                    onChange={(e) =>
                      setNewUserPassword(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3 bg-white"
                    required
                  />

                  <select
                    value={
                      newUserRole
                    }
                    onChange={(e) =>
                      setNewUserRole(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3 bg-white"
                  >

                    <option value="public">
                      Public
                    </option>

                    <option value="investigator">
                      Investigator
                    </option>

                    <option value="admin">
                      Admin
                    </option>

                  </select>

                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg"
                  >
                    Create User
                  </button>

                </form>

              </div>
            )}

          </AccordionSection>

          <AccordionSection
            title="Search & Filter Cases"
            icon="🔎"
            sectionKey="search"
            openSection={
              openAdminSection
            }
            setOpenSection={
              setOpenAdminSection
            }
          >

            <div className="p-6">

              <p className="text-gray-500 text-sm mb-5">
                Quickly find a missing-person case
                using the available filters.
              </p>

              <div className="grid md:grid-cols-3 gap-4">

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Search
                  </label>

                  <input
                    type="text"
                    placeholder="Search by name or location..."
                    value={
                      caseSearch
                    }
                    onChange={(e) =>
                      setCaseSearch(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Status
                  </label>

                  <select
                    value={
                      caseStatusFilter
                    }
                    onChange={(e) =>
                      setCaseStatusFilter(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  >

                    <option value="all">
                      All Statuses
                    </option>

                    <option value="active">
                      Active
                    </option>

                    <option value="found">
                      Found
                    </option>

                    <option value="closed">
                      Closed
                    </option>

                  </select>

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Gender
                  </label>

                  <select
                    value={
                      caseGenderFilter
                    }
                    onChange={(e) =>
                      setCaseGenderFilter(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  >

                    <option value="all">
                      All Genders
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">

                <span className="text-sm text-gray-600">
                  Showing{" "}
                  <strong>
                    {
                      filteredCases.length
                    }
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {
                      missingPersons.length
                    }
                  </strong>{" "}
                  cases
                </span>

                {(caseSearch ||
                  caseStatusFilter !==
                    "all" ||
                  caseGenderFilter !==
                    "all") && (

                  <button
                    onClick={() => {
                      setCaseSearch("");
                      setCaseStatusFilter(
                        "all"
                      );
                      setCaseGenderFilter(
                        "all"
                      );
                    }}
                    className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg"
                  >
                    Clear Filters
                  </button>

                )}

              </div>

            </div>

          </AccordionSection>

          <AccordionSection
            title="Registered Missing Persons"
            icon="👤"
            sectionKey="cases"
            openSection={
              openAdminSection
            }
            setOpenSection={
              setOpenAdminSection
            }
          >

            <div className="p-6">

              <p className="text-gray-500 text-sm">
                Official missing-person cases
                registered in the system.
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-100">

                  <tr>

                    <th className="p-3 text-left">
                      ID
                    </th>

                    <th className="p-3 text-left">
                      Name
                    </th>

                    <th className="p-3 text-left">
                      Age
                    </th>

                    <th className="p-3 text-left">
                      Gender
                    </th>

                    <th className="p-3 text-left">
                      Location
                    </th>

                    <th className="p-3 text-left">
                      Status
                    </th>

                    <th className="p-3 text-left">
                      Photo
                    </th>

                    <th className="p-3 text-left">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredCases.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="8"
                        className="p-8 text-center text-gray-500"
                      >
                        No cases match the
                        selected filters.
                      </td>

                    </tr>

                  ) : (

                    filteredCases.map(
                      (person) => (

                        <tr
                          key={
                            person.id
                          }
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="p-3">
                            {person.id}
                          </td>

                          <td className="p-3 font-medium">
                            {person.name}
                          </td>

                          <td className="p-3">
                            {person.age}
                          </td>

                          <td className="p-3">
                            {person.gender}
                          </td>

                          <td className="p-3">
                            {
                              person.last_seen_location
                            }
                          </td>

                          <td className="p-3">

                            <StatusBadge
                              status={
                                person.status
                              }
                            />

                          </td>

                          <td className="p-3">
                            {person.photo_path
                              ? "Uploaded"
                              : "No photo"}
                          </td>

                          <td className="p-3">

                            <button
                              onClick={() =>
                                setSelectedCase(
                                  person
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                            >
                              👁️ View Details
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </AccordionSection>

          <AccordionSection
            title="Public Reports Review"
            icon="📢"
            sectionKey="reports"
            openSection={
              openAdminSection
            }
            setOpenSection={
              setOpenAdminSection
            }
          >

            <PublicReportsReview
              publicReports={
                publicReports
              }
              handleReportAction={
                handleReportAction
              }
            />

          </AccordionSection>

          <AccordionSection
            title="Registered Users"
            icon="👥"
            sectionKey="users"
            openSection={
              openAdminSection
            }
            setOpenSection={
              setOpenAdminSection
            }
          >

            <div>

              <div className="p-6">

                <p className="text-gray-500 text-sm">
                  Manage system users and their
                  roles.
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-gray-100">

                    <tr>

                      <th className="p-3 text-left">
                        ID
                      </th>

                      <th className="p-3 text-left">
                        Name
                      </th>

                      <th className="p-3 text-left">
                        Email
                      </th>

                      <th className="p-3 text-left">
                        Role
                      </th>

                      <th className="p-3 text-left">
                        Created
                      </th>

                      <th className="p-3 text-left">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {users.map(
                      (user) => (

                        <tr
                          key={
                            user.id
                          }
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="p-3">
                            {user.id}
                          </td>

                          <td className="p-3">
                            {user.name}
                          </td>

                          <td className="p-3">
                            {user.email}
                          </td>

                          <td className="p-3">

                            <StatusBadge
                              status={
                                user.role
                              }
                            />

                          </td>

                          <td className="p-3">

                            {user.created_at
                              ? new Date(
                                  user.created_at
                                ).toLocaleString()
                              : "-"}

                          </td>

                          <td className="p-3">

                            <div className="flex flex-col sm:flex-row gap-2 min-w-[220px]">

                              <select
                                value={
                                  userRoleSelections[
                                    user.id
                                  ] ||
                                  user.role
                                }
                                onChange={(e) =>
                                  setUserRoleSelections(
                                    (
                                      current
                                    ) => ({
                                      ...current,
                                      [user.id]:
                                        e.target
                                          .value,
                                    })
                                  )
                                }
                                className="border rounded-lg p-2 bg-white text-sm"
                                disabled={
                                  updatingUserId ===
                                  user.id
                                }
                              >

                                <option value="public">
                                  Public
                                </option>

                                <option value="investigator">
                                  Investigator
                                </option>

                                <option value="admin">
                                  Admin
                                </option>

                              </select>

                              <button
                                onClick={() =>
                                  handleUpdateUserRole(
                                    user.id
                                  )
                                }
                                disabled={
                                  updatingUserId ===
                                  user.id
                                }
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
                              >

                                {updatingUserId ===
                                user.id
                                  ? "Updating..."
                                  : "Update Role"}

                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </AccordionSection>

        </main>

        {selectedCase && (
          <CaseDetailsModal
            selectedCase={
              selectedCase
            }
            setSelectedCase={
              setSelectedCase
            }
            handleCaseStatusUpdate={
              handleCaseStatusUpdate
            }
          />
        )}

      </div>
    );
  }

  // =========================================================
  // INVESTIGATOR DASHBOARD
  // =========================================================

  if (role === "investigator") {
    return (
      <div className="min-h-screen bg-gray-100">

        <header className="bg-white shadow px-8 py-4 flex justify-between items-center">

          <div>

            <h1 className="text-2xl font-bold">
              Investigator Dashboard
            </h1>

            <p className="text-gray-500">
              Missing Person Investigation Portal
            </p>

          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>

        </header>

        <main className="p-8">

          {message && (
            <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
              {message}
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-6 mb-8">

            <DashboardCard
              title="Total Cases"
              value={
                missingPersons.length
              }
            />

            <DashboardCard
              title="Active Cases"
              value={
                missingPersons.filter(
                  (person) =>
                    person.status ===
                    "active"
                ).length
              }
            />

            <DashboardCard
              title="Found Cases"
              value={
                missingPersons.filter(
                  (person) =>
                    person.status ===
                    "found"
                ).length
              }
            />

            <DashboardCard
              title="Pending Reports"
              value={
                publicReports.filter(
                  (report) =>
                    report.status ===
                    "pending"
                ).length
              }
            />

          </div>

          {/* =================================================
              AI FACE MATCHING FOR INVESTIGATOR
          ================================================== */}

          <AccordionSection
            title="Find Missing Person by Photo"
            icon="🤖"
            sectionKey="faceMatching"
            openSection={
              openInvestigatorSection
            }
            setOpenSection={
              setOpenInvestigatorSection
            }
          >

            <div className="p-6">

              <h2 className="text-2xl font-bold mb-2">
                AI Face Matching
              </h2>

              <p className="text-gray-600 mb-6">
                Upload a photograph of a person.
                The AI system will compare the
                face with registered missing-person
                case photographs and display the
                closest matching cases.
              </p>

              <form
                onSubmit={
                  handleFaceMatching
                }
                className="space-y-5"
              >

                <div className="bg-gray-50 border rounded-xl p-6">

                  <label className="block font-medium mb-2">
                    Upload Photograph
                  </label>

                  <input
                    id="face-match-photo"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0] ||
                        null;

                      setFaceMatchPhoto(
                        file
                      );

                      setFaceMatchResults(
                        null
                      );

                      setMessage("");
                    }}
                    className="w-full border rounded-lg p-3 bg-white"
                    required
                  />

                  <p className="text-sm text-gray-500 mt-2">
                    JPG, JPEG, PNG or WEBP
                  </p>

                  {faceMatchPhoto && (
  <div className="mt-4">
    <p className="text-sm font-medium mb-2">
      Selected Image
    </p>

    <div className="relative inline-block max-w-full">
      <img
        src={faceMatchPreviewUrl}
        alt="Uploaded query"
        onLoad={handleFaceMatchImageLoad}
        className="block w-96 max-w-full h-auto rounded-xl border"
      />

      {faceMatchResults?.query_face_bbox &&
        faceMatchImageDimensions.width > 0 &&
        faceMatchImageDimensions.height > 0 && (
          <div
            className="absolute border-4 border-green-500 rounded-lg pointer-events-none"
            style={{
              left: `${
                faceMatchResults.query_face_bbox.x1 *
                (faceMatchImageDimensions.width /
                  faceMatchImageDimensions.naturalWidth)
              }px`,
              top: `${
                faceMatchResults.query_face_bbox.y1 *
                (faceMatchImageDimensions.height /
                  faceMatchImageDimensions.naturalHeight)
              }px`,
              width: `${
                (faceMatchResults.query_face_bbox.x2 -
                  faceMatchResults.query_face_bbox.x1) *
                (faceMatchImageDimensions.width /
                  faceMatchImageDimensions.naturalWidth)
              }px`,
              height: `${
                (faceMatchResults.query_face_bbox.y2 -
                  faceMatchResults.query_face_bbox.y1) *
                (faceMatchImageDimensions.height /
                  faceMatchImageDimensions.naturalHeight)
              }px`,
            }}
          >
            <span className="absolute -top-8 left-0 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
              Face detected
            </span>
          </div>
        )}
    </div>
  </div>
)}

                </div>

                <div className="flex flex-wrap gap-3">

                  <button
                    type="submit"
                    disabled={
                      faceMatchLoading ||
                      !faceMatchPhoto
                    }
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium"
                  >

                    {faceMatchLoading
                      ? "🤖 Matching..."
                      : "🔎 Find Matches"}

                  </button>

                  {(faceMatchPhoto ||
                    faceMatchResults) && (

                    <button
                      type="button"
                      onClick={
                        clearFaceMatching
                      }
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium"
                    >
                      Clear
                    </button>

                  )}

                </div>

              </form>

            </div>

            {/* =================================================
                INVESTIGATOR FACE MATCH RESULTS
            ================================================== */}

            {faceMatchResults && (
              <FaceMatchResults
                results={
                  faceMatchResults
                }
              />
            )}

          </AccordionSection>

          <AccordionSection
            title="Investigator Controls"
            icon="🕵️"
            sectionKey="controls"
            openSection={
              openInvestigatorSection
            }
            setOpenSection={
              setOpenInvestigatorSection
            }
          >

            <div className="p-6">

              <button
                onClick={() => {
                  setShowMissingForm(
                    !showMissingForm
                  );
                  setMessage("");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {showMissingForm
                  ? "✕ Close Missing Person Form"
                  : "+ Register Missing Person"}
              </button>

            </div>

            {showMissingForm && (
              <div className="px-6 pb-6">

                <MissingPersonForm
                  missingName={
                    missingName
                  }
                  setMissingName={
                    setMissingName
                  }
                  missingAge={
                    missingAge
                  }
                  setMissingAge={
                    setMissingAge
                  }
                  missingGender={
                    missingGender
                  }
                  setMissingGender={
                    setMissingGender
                  }
                  missingDescription={
                    missingDescription
                  }
                  setMissingDescription={
                    setMissingDescription
                  }
                  lastSeenLocation={
                    lastSeenLocation
                  }
                  setLastSeenLocation={
                    setLastSeenLocation
                  }
                  lastSeenDate={
                    lastSeenDate
                  }
                  setLastSeenDate={
                    setLastSeenDate
                  }
                  setMissingPhoto={
                    setMissingPhoto
                  }
                  handleSubmit={
                    handleCreateMissingPerson
                  }
                  title="Register Missing Person"
                />

              </div>
            )}

          </AccordionSection>

          <AccordionSection
            title="Search & Filter Cases"
            icon="🔎"
            sectionKey="search"
            openSection={
              openInvestigatorSection
            }
            setOpenSection={
              setOpenInvestigatorSection
            }
          >

            <div className="p-6">

              <p className="text-gray-500 text-sm mb-5">
                Quickly find a missing-person case
                using the available filters.
              </p>

              <div className="grid md:grid-cols-3 gap-4">

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Search
                  </label>

                  <input
                    type="text"
                    placeholder="Search by name or location..."
                    value={
                      caseSearch
                    }
                    onChange={(e) =>
                      setCaseSearch(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Status
                  </label>

                  <select
                    value={
                      caseStatusFilter
                    }
                    onChange={(e) =>
                      setCaseStatusFilter(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  >

                    <option value="all">
                      All Statuses
                    </option>

                    <option value="active">
                      Active
                    </option>

                    <option value="found">
                      Found
                    </option>

                    <option value="closed">
                      Closed
                    </option>

                  </select>

                </div>

                <div>

                  <label className="block text-sm font-medium mb-2">
                    Gender
                  </label>

                  <select
                    value={
                      caseGenderFilter
                    }
                    onChange={(e) =>
                      setCaseGenderFilter(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-lg p-3"
                  >

                    <option value="all">
                      All Genders
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">

                <span className="text-sm text-gray-600">
                  Showing{" "}
                  <strong>
                    {
                      filteredCases.length
                    }
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {
                      missingPersons.length
                    }
                  </strong>{" "}
                  cases
                </span>

                {(caseSearch ||
                  caseStatusFilter !==
                    "all" ||
                  caseGenderFilter !==
                    "all") && (

                  <button
                    onClick={() => {
                      setCaseSearch("");
                      setCaseStatusFilter(
                        "all"
                      );
                      setCaseGenderFilter(
                        "all"
                      );
                    }}
                    className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg"
                  >
                    Clear Filters
                  </button>

                )}

              </div>

            </div>

          </AccordionSection>

          <AccordionSection
            title="Missing Person Cases"
            icon="👤"
            sectionKey="cases"
            openSection={
              openInvestigatorSection
            }
            setOpenSection={
              setOpenInvestigatorSection
            }
          >

            <div className="p-6">

              <p className="text-gray-500 text-sm">
                Official missing-person cases
                registered in the system.
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-100">

                  <tr>

                    <th className="p-3 text-left">
                      ID
                    </th>

                    <th className="p-3 text-left">
                      Name
                    </th>

                    <th className="p-3 text-left">
                      Age
                    </th>

                    <th className="p-3 text-left">
                      Gender
                    </th>

                    <th className="p-3 text-left">
                      Location
                    </th>

                    <th className="p-3 text-left">
                      Last Seen
                    </th>

                    <th className="p-3 text-left">
                      Status
                    </th>

                    <th className="p-3 text-left">
                      Photo
                    </th>

                    <th className="p-3 text-left">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredCases.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="9"
                        className="p-8 text-center text-gray-500"
                      >
                        No cases match the
                        selected filters.
                      </td>

                    </tr>

                  ) : (

                    filteredCases.map(
                      (person) => (

                        <tr
                          key={
                            person.id
                          }
                          className="border-t hover:bg-gray-50"
                        >

                          <td className="p-3">
                            {person.id}
                          </td>

                          <td className="p-3 font-medium">
                            {person.name}
                          </td>

                          <td className="p-3">
                            {person.age}
                          </td>

                          <td className="p-3">
                            {person.gender}
                          </td>

                          <td className="p-3">
                            {
                              person.last_seen_location
                            }
                          </td>

                          <td className="p-3">

                            {person.last_seen_date
                              ? new Date(
                                  person.last_seen_date
                                ).toLocaleString()
                              : "-"}

                          </td>

                          <td className="p-3">

                            <StatusBadge
                              status={
                                person.status
                              }
                            />

                          </td>

                          <td className="p-3">

                            {person.photo_path
                              ? "Uploaded"
                              : "No photo"}

                          </td>

                          <td className="p-3">

                            <button
                              onClick={() =>
                                setSelectedCase(
                                  person
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                            >
                              👁️ View Details
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </AccordionSection>

          <AccordionSection
            title="Public Reports Review"
            icon="📢"
            sectionKey="reports"
            openSection={
              openInvestigatorSection
            }
            setOpenSection={
              setOpenInvestigatorSection
            }
          >

            <PublicReportsReview
              publicReports={
                publicReports
              }
              handleReportAction={
                handleReportAction
              }
            />

          </AccordionSection>

        </main>

        {selectedCase && (
          <CaseDetailsModal
            selectedCase={
              selectedCase
            }
            setSelectedCase={
              setSelectedCase
            }
            handleCaseStatusUpdate={
              handleCaseStatusUpdate
            }
          />
        )}

      </div>
    );
  }

  // =========================================================
  // PUBLIC DASHBOARD
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-100">

      <header className="bg-white shadow px-8 py-4 flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold">
            Public Dashboard
          </h1>

          <p className="text-gray-500">
            Finding Missing Person Using AI
          </p>

        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>

      </header>

      <main className="p-8">

        {message && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
            {message}
          </div>
        )}

        {/* WELCOME */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">

          <h2 className="text-2xl font-bold">
            Welcome,{" "}
            {publicDashboard?.user?.name ||
              "User"}{" "}
            👋
          </h2>

          <p className="text-gray-500 mt-1">
            You can submit reports and search
            for missing persons using AI-powered
            facial matching.
          </p>

        </div>

        {/* STATISTICS */}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <DashboardCard
            title="Total Reports"
            value={
              publicStats.total_reports
            }
          />

          <DashboardCard
            title="Pending"
            value={
              publicStats.pending_reports
            }
          />

          <DashboardCard
            title="Approved"
            value={
              publicStats.approved_reports
            }
          />

          <DashboardCard
            title="Rejected"
            value={
              publicStats.rejected_reports
            }
          />

        </div>

        {/* =================================================
            AI FACE MATCHING
        ================================================== */}

        <AccordionSection
          title="Find Missing Person by Photo"
          icon="🤖"
          sectionKey="faceMatching"
          openSection={
            openPublicSection
          }
          setOpenSection={
            setOpenPublicSection
          }
        >

          <div className="p-6">

            <h2 className="text-2xl font-bold mb-2">
              AI Face Matching
            </h2>

            <p className="text-gray-600 mb-6">
              Upload a photograph of a missing
              person. The AI system will compare
              the face with registered missing-person
              cases and show the closest matches.
            </p>

            <form
              onSubmit={
                handleFaceMatching
              }
              className="space-y-5"
            >

              <div className="bg-gray-50 border rounded-xl p-6">

                <label className="block font-medium mb-2">
                  Upload Photograph
                </label>

                <input
                  id="face-match-photo"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const file =
                      e.target.files?.[0] ||
                      null;

                    setFaceMatchPhoto(
                      file
                    );

                    setFaceMatchResults(
                      null
                    );

                    setMessage("");
                  }}
                  className="w-full border rounded-lg p-3 bg-white"
                  required
                />

                <p className="text-sm text-gray-500 mt-2">
                  JPG, JPEG, PNG or WEBP
                </p>

                {faceMatchPhoto && (
  <div className="mt-4">
    <p className="text-sm font-medium mb-2">
      Selected Image
    </p>

    <div className="relative inline-block max-w-full">
      <img
        src={faceMatchPreviewUrl}
        alt="Uploaded query"
        onLoad={handleFaceMatchImageLoad}
        className="block w-96 max-w-full h-auto rounded-xl border"
      />

      {faceMatchResults?.query_face_bbox &&
        faceMatchImageDimensions.width > 0 &&
        faceMatchImageDimensions.height > 0 && (
          <div
            className="absolute border-4 border-green-500 rounded-lg pointer-events-none"
            style={{
              left: `${
                faceMatchResults.query_face_bbox.x1 *
                (faceMatchImageDimensions.width /
                  faceMatchImageDimensions.naturalWidth)
              }px`,

              top: `${
                faceMatchResults.query_face_bbox.y1 *
                (faceMatchImageDimensions.height /
                  faceMatchImageDimensions.naturalHeight)
              }px`,

              width: `${
                (faceMatchResults.query_face_bbox.x2 -
                  faceMatchResults.query_face_bbox.x1) *
                (faceMatchImageDimensions.width /
                  faceMatchImageDimensions.naturalWidth)
              }px`,

              height: `${
                (faceMatchResults.query_face_bbox.y2 -
                  faceMatchResults.query_face_bbox.y1) *
                (faceMatchImageDimensions.height /
                  faceMatchImageDimensions.naturalHeight)
              }px`,
            }}
          >
            <span className="absolute -top-8 left-0 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
              Face detected
            </span>
          </div>
        )}
    </div>
  </div>
)}

              </div>

              <div className="flex flex-wrap gap-3">

                <button
                  type="submit"
                  disabled={
                    faceMatchLoading ||
                    !faceMatchPhoto
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium"
                >

                  {faceMatchLoading
                    ? "🤖 Matching..."
                    : "🔎 Find Matches"}

                </button>

                {(faceMatchPhoto ||
                  faceMatchResults) && (

                  <button
                    type="button"
                    onClick={
                      clearFaceMatching
                    }
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium"
                  >
                    Clear
                  </button>

                )}

              </div>

            </form>

          </div>

          {/* =================================================
              FACE MATCH RESULTS
          ================================================== */}

          {faceMatchResults && (
            <FaceMatchResults
              results={
                faceMatchResults
              }
            />
          )}

        </AccordionSection>

        {/* =================================================
            PUBLIC REPORTING
        ================================================== */}

        <AccordionSection
          title="Report a Missing Person"
          icon="📝"
          sectionKey="report"
          openSection={
            openPublicSection
          }
          setOpenSection={
            setOpenPublicSection
          }
        >

          <div className="p-6">

            <h2 className="text-2xl font-bold mb-2">
              Help Find a Missing Person
            </h2>

            <p className="text-gray-600 mb-5">
              If someone you know is missing,
              submit their details and
              photograph. Your report will be
              reviewed by an authorized
              investigator.
            </p>

            <button
              onClick={() => {
                setShowReportForm(
                  !showReportForm
                );
                setMessage("");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
            >
              {showReportForm
                ? "✕ Close Report Form"
                : "+ Report Missing Person"}
            </button>

          </div>

          {showReportForm && (
            <form
              onSubmit={
                handlePublicReport
              }
              className="px-6 pb-6 space-y-4"
            >

              <div className="bg-gray-50 border rounded-xl p-6 space-y-4">

                <h2 className="text-xl font-bold">
                  Report Missing Person
                </h2>

                <p className="text-sm text-gray-500">
                  Please provide accurate
                  information. Your report will
                  initially remain pending until
                  reviewed.
                </p>

                <input
                  type="text"
                  placeholder="Missing Person's Full Name"
                  value={
                    reportName
                  }
                  onChange={(e) =>
                    setReportName(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 bg-white"
                  required
                />

                <input
                  type="number"
                  placeholder="Age"
                  value={
                    reportAge
                  }
                  onChange={(e) =>
                    setReportAge(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 bg-white"
                  min="0"
                  required
                />

                <select
                  value={
                    reportGender
                  }
                  onChange={(e) =>
                    setReportGender(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 bg-white"
                >

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

                <input
                  type="text"
                  placeholder="Last Seen Location"
                  value={
                    reportLocation
                  }
                  onChange={(e) =>
                    setReportLocation(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 bg-white"
                  required
                />

                <input
                  type="datetime-local"
                  value={
                    reportDate
                  }
                  onChange={(e) =>
                    setReportDate(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 bg-white"
                  required
                />

                <textarea
                  placeholder="Description / Additional Information"
                  value={
                    reportDescription
                  }
                  onChange={(e) =>
                    setReportDescription(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-3 bg-white"
                  rows="4"
                />

                <div>

                  <label className="block font-medium mb-2">
                    Photograph of Missing Person
                  </label>

                  <input
                    id="report-photo"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) =>
                      setReportPhoto(
                        e.target.files[0]
                      )
                    }
                    className="w-full border rounded-lg p-3 bg-white"
                    required
                  />

                  <p className="text-sm text-gray-500 mt-1">
                    JPG, JPEG, PNG or WEBP
                  </p>

                </div>

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg"
                >
                  Submit Report
                </button>

              </div>

            </form>
          )}

        </AccordionSection>

        {/* =================================================
            MY REPORTS
        ================================================== */}

        <AccordionSection
          title="My Reports"
          icon="📋"
          sectionKey="myReports"
          openSection={
            openPublicSection
          }
          setOpenSection={
            setOpenPublicSection
          }
        >

          <div className="bg-white overflow-hidden">

            <div className="p-6">

              <div className="flex justify-between items-center">

                <div>

                  <h2 className="text-xl font-bold">
                    My Reports
                  </h2>

                  <p className="text-gray-500 text-sm mt-1">
                    Track the reports you have
                    submitted.
                  </p>

                </div>

                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {myReports.length} Reports
                </span>

              </div>

            </div>

            {myReports.length === 0 ? (

              <div className="p-8 text-center text-gray-500">
                You have not submitted any
                reports yet.
              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-gray-100">

                    <tr>

                      <th className="p-3 text-left">
                        ID
                      </th>

                      <th className="p-3 text-left">
                        Missing Person
                      </th>

                      <th className="p-3 text-left">
                        Age
                      </th>

                      <th className="p-3 text-left">
                        Location
                      </th>

                      <th className="p-3 text-left">
                        Last Seen
                      </th>

                      <th className="p-3 text-left">
                        Status
                      </th>

                      <th className="p-3 text-left">
                        Official Case ID
                      </th>

                      <th className="p-3 text-left">
                        Photo
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {myReports.map(
                      (report) => (

                        <tr
                          key={
                            report.id
                          }
                          className="border-t"
                        >

                          <td className="p-3">
                            {report.id}
                          </td>

                          <td className="p-3 font-medium">
                            {
                              report.missing_person_name
                            }
                          </td>

                          <td className="p-3">
                            {report.age}
                          </td>

                          <td className="p-3">
                            {
                              report.last_seen_location
                            }
                          </td>

                          <td className="p-3">
                            {report.last_seen_date
                              ? new Date(
                                  report.last_seen_date
                                ).toLocaleString()
                              : "-"}
                          </td>

                          <td className="p-3">

                            <StatusBadge
                              status={
                                report.status
                              }
                            />

                          </td>

                          <td className="p-3">

                            {report.official_case_id ? (

                              <span className="font-semibold text-green-700">
                                Case #
                                {
                                  report.official_case_id
                                }
                              </span>

                            ) : (

                              <span className="text-gray-500">
                                -
                              </span>

                            )}

                          </td>

                          <td className="p-3">

                            {report.photo_path
                              ? "Uploaded"
                              : "No photo"}

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </AccordionSection>

        {/* =================================================
            REPORT DETAILS
        ================================================== */}

        {myReports.length > 0 && (

          <AccordionSection
            title="Report Details"
            icon="🔍"
            sectionKey="details"
            openSection={
              openPublicSection
            }
            setOpenSection={
              setOpenPublicSection
            }
          >

            <div className="p-6">

              <div className="grid md:grid-cols-2 gap-6">

                {myReports.map(
                  (report) => (

                    <div
                      key={
                        report.id
                      }
                      className="border rounded-xl p-5"
                    >

                      <div className="flex justify-between items-start mb-4">

                        <div>

                          <h3 className="text-lg font-bold">
                            {
                              report.missing_person_name
                            }
                          </h3>

                          <p className="text-sm text-gray-500">
                            Report #{report.id}
                          </p>

                        </div>

                        <StatusBadge
                          status={
                            report.status
                          }
                        />

                      </div>

                      <div className="space-y-2 text-sm">

                        <p>
                          <strong>
                            Age:
                          </strong>{" "}
                          {report.age}
                        </p>

                        <p>
                          <strong>
                            Gender:
                          </strong>{" "}
                          {report.gender}
                        </p>

                        <p>
                          <strong>
                            Last Seen Location:
                          </strong>{" "}
                          {
                            report.last_seen_location
                          }
                        </p>

                        <p>
                          <strong>
                            Last Seen:
                          </strong>{" "}
                          {report.last_seen_date
                            ? new Date(
                                report.last_seen_date
                              ).toLocaleString()
                            : "-"}
                        </p>

                        <p>
                          <strong>
                            Submitted:
                          </strong>{" "}
                          {report.created_at
                            ? new Date(
                                report.created_at
                              ).toLocaleString()
                            : "-"}
                        </p>

                        <p>
                          <strong>
                            Description:
                          </strong>{" "}
                          {report.description ||
                            "No additional information"}
                        </p>

                        <p>
                          <strong>
                            Official Case ID:
                          </strong>{" "}
                          {report.official_case_id
                            ? `Case #${report.official_case_id}`
                            : "Not assigned yet"}
                        </p>

                        <p>
                          <strong>
                            Photo:
                          </strong>{" "}
                          {report.photo_path
                            ? "Uploaded"
                            : "No photo"}
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </AccordionSection>

        )}

        {/* =================================================
            INFORMATION
        ================================================== */}

        <AccordionSection
          title="Information & Safety"
          icon="ℹ️"
          sectionKey="information"
          openSection={
            openPublicSection
          }
          setOpenSection={
            setOpenPublicSection
          }
        >

          <div className="p-6">

            <div className="grid md:grid-cols-2 gap-6">

              <div className="bg-gray-50 border rounded-xl p-6">

                <h2 className="text-xl font-bold mb-4">
                  How the Reporting Process Works
                </h2>

                <div className="space-y-3 text-gray-600">

                  <p>
                    <strong>1.</strong> Submit the
                    missing person's details and
                    photograph.
                  </p>

                  <p>
                    <strong>2.</strong> Your report is
                    marked as pending.
                  </p>

                  <p>
                    <strong>3.</strong> An authorized
                    investigator reviews the
                    information.
                  </p>

                  <p>
                    <strong>4.</strong> Approved reports
                    can become official
                    missing-person cases.
                  </p>

                  <p>
                    <strong>5.</strong> Verified cases
                    can be processed by the AI
                    identification system.
                  </p>

                </div>

              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-6">

                <h2 className="text-xl font-bold text-red-700 mb-4">
                  Emergency Information
                </h2>

                <div className="space-y-3 text-gray-700">

                  <p>
                    If someone has recently gone
                    missing, contact your local
                    police station as soon as
                    possible.
                  </p>

                  <p>
                    Provide recent photographs and
                    accurate information about the
                    person's last known location.
                  </p>

                  <p>
                    This platform is intended to
                    assist with reporting and
                    identification and does not
                    replace official emergency
                    services.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </AccordionSection>

      </main>

    </div>
  );
}

// =========================================================
// FACE MATCH RESULTS
// =========================================================

function FaceMatchResults({
  results,
}) {
  const bestMatch =
    results.best_match;

  return (
    <div className="border-t bg-gray-50">

      <div className="p-6">

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

          <div>

            <h2 className="text-2xl font-bold">
              AI Matching Results
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Compared against{" "}
              <strong>
                {
                  results.total_cases_compared
                }
              </strong>{" "}
              registered case
              {results.total_cases_compared ===
              1
                ? ""
                : "s"}
              .
            </p>

          </div>

          <div
            className={`px-4 py-2 rounded-lg font-semibold ${
              results.match_found
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >

            {results.match_found
              ? "✓ Potential Match Found"
              : "✕ No Match Found"}

          </div>

        </div>

        {/* BEST MATCH */}

        {bestMatch && (

          <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 mb-8 shadow-sm">

            <div className="flex flex-col md:flex-row gap-6">

              <div className="w-full md:w-64">

                {bestMatch.photo_path ? (

                  <img
                    src={getPhotoUrl(
                      bestMatch.photo_path
                    )}
                    alt={
                      bestMatch.name
                    }
                    className="w-full h-64 object-cover rounded-xl border"
                  />

                ) : (

                  <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
                    No Photo
                  </div>

                )}

              </div>

              <div className="flex-1">

                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">

                  <div>

                    <p className="text-sm text-gray-500">
                      Best Matching Case
                    </p>

                    <h3 className="text-2xl font-bold mt-1">
                      {bestMatch.name}
                    </h3>

                    <p className="text-gray-500 mt-1">
                      Official Case #
                      {
                        bestMatch.case_id
                      }
                    </p>

                  </div>

                  <div
                    className={`self-start px-4 py-2 rounded-xl font-bold ${
                      bestMatch.match_found
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >

                    {bestMatch.match_found
                      ? "MATCH"
                      : "NO MATCH"}

                  </div>

                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">

                  <div className="bg-gray-50 rounded-lg p-4">

                    <p className="text-sm text-gray-500">
                      Similarity Score
                    </p>

                    <p className="text-2xl font-bold text-blue-700">
                      {(
                        bestMatch.similarity_score *
                        100
                      ).toFixed(2)}
                      %
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">

                    <p className="text-sm text-gray-500">
                      Matching Threshold
                    </p>

                    <p className="text-2xl font-bold">
                      {(
                        results.threshold *
                        100
                      ).toFixed(0)}
                      %
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">

                    <p className="text-sm text-gray-500">
                      Age
                    </p>

                    <p className="font-semibold">
                      {bestMatch.age}
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">

                    <p className="text-sm text-gray-500">
                      Gender
                    </p>

                    <p className="font-semibold">
                      {bestMatch.gender}
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 sm:col-span-2">

                    <p className="text-sm text-gray-500">
                      Last Seen Location
                    </p>

                    <p className="font-semibold">
                      {
                        bestMatch.last_seen_location
                      }
                    </p>

                  </div>

                </div>

                <div className="mt-5">

                  <p className="text-sm text-gray-500 mb-1">
                    Description
                  </p>

                  <p className="text-gray-700">
                    {bestMatch.description ||
                      "No additional information available."}
                  </p>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* ALL MATCHES */}

        <div className="bg-white border rounded-2xl overflow-hidden">

          <div className="p-6 border-b">

            <h3 className="text-xl font-bold">
              All Matching Results
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Results are ranked from highest to
              lowest facial similarity.
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-3 text-left">
                    Rank
                  </th>

                  <th className="p-3 text-left">
                    Photo
                  </th>

                  <th className="p-3 text-left">
                    Case ID
                  </th>

                  <th className="p-3 text-left">
                    Name
                  </th>

                  <th className="p-3 text-left">
                    Age
                  </th>

                  <th className="p-3 text-left">
                    Location
                  </th>

                  <th className="p-3 text-left">
                    Status
                  </th>

                  <th className="p-3 text-left">
                    Similarity
                  </th>

                  <th className="p-3 text-left">
                    Result
                  </th>

                </tr>

              </thead>

              <tbody>

                {results.matches.map(
                  (match, index) => (

                    <tr
                      key={
                        match.case_id
                      }
                      className={`border-t ${
                        index === 0
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >

                      <td className="p-3 font-bold">
                        #{index + 1}
                      </td>

                      <td className="p-3">

                        {match.photo_path ? (

                          <img
                            src={getPhotoUrl(
                              match.photo_path
                            )}
                            alt={
                              match.name
                            }
                            className="w-16 h-16 object-cover rounded-lg border"
                          />

                        ) : (

                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                            No Photo
                          </div>

                        )}

                      </td>

                      <td className="p-3 font-medium">
                        #{match.case_id}
                      </td>

                      <td className="p-3 font-semibold">
                        {match.name}
                      </td>

                      <td className="p-3">
                        {match.age}
                      </td>

                      <td className="p-3">
                        {
                          match.last_seen_location
                        }
                      </td>

                      <td className="p-3">

                        <StatusBadge
                          status={
                            match.status
                          }
                        />

                      </td>

                      <td className="p-3">

                        <div className="min-w-[130px]">

                          <div className="font-bold text-blue-700">

                            {(
                              match.similarity_score *
                              100
                            ).toFixed(2)}
                            %

                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">

                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    match.similarity_score *
                                      100
                                  )
                                )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>

                      <td className="p-3">

                        {match.match_found ? (

                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Match
                          </span>

                        ) : (

                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                            No Match
                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">

          <p className="text-sm text-yellow-800">

            <strong>Important:</strong>{" "}
            Similarity scores indicate facial
            similarity between the uploaded image
            and registered case photographs. They
            are not guaranteed identification or
            statistical probabilities. Final
            identification should be verified by
            authorized investigators.

          </p>

        </div>

      </div>

    </div>
  );
}

// =========================================================
// ACCORDION SECTION
// =========================================================

function AccordionSection({
  title,
  icon,
  sectionKey,
  openSection,
  setOpenSection,
  children,
}) {
  const isOpen =
    openSection === sectionKey;

  return (
    <div className="bg-white rounded-xl shadow mb-8 overflow-hidden">

      <button
        type="button"
        onClick={() =>
          setOpenSection(
            isOpen
              ? null
              : sectionKey
          )
        }
        className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition"
      >

        <div className="flex items-center gap-3">

          <span className="text-xl">
            {icon}
          </span>

          <span className="text-xl font-bold">
            {title}
          </span>

        </div>

        <span className="text-gray-500 text-lg">
          {isOpen
            ? "▲"
            : "▼"}
        </span>

      </button>

      {isOpen && (

        <div className="border-t">
          {children}
        </div>

      )}

    </div>
  );
}

// =========================================================
// CASE DETAILS MODAL
// =========================================================

function CaseDetailsModal({
  selectedCase,
  setSelectedCase,
  handleCaseStatusUpdate,
}) {
  const [newStatus, setNewStatus] =
    useState(
      selectedCase.status ||
        "active"
    );

  const handleUpdate = async () => {
    await handleCaseStatusUpdate(
      selectedCase.id,
      newStatus
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={() =>
        setSelectedCase(null)
      }
    >

      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="flex justify-between items-center p-6 border-b">

          <div>

            <h2 className="text-2xl font-bold">
              Missing Person Case Details
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Official Case #
              {selectedCase.id}
            </p>

          </div>

          <button
            onClick={() =>
              setSelectedCase(null)
            }
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium"
          >
            ✕ Close
          </button>

        </div>

        <div className="p-6">

          <div className="grid md:grid-cols-2 gap-6">

            <div className="space-y-4">

              <div>

                <p className="text-sm text-gray-500">
                  Full Name
                </p>

                <p className="font-semibold text-lg">
                  {selectedCase.name}
                </p>

              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Age
                </p>

                <p className="font-semibold">
                  {selectedCase.age}
                </p>

              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Gender
                </p>

                <p className="font-semibold">
                  {selectedCase.gender}
                </p>

              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Last Seen Location
                </p>

                <p className="font-semibold">
                  {
                    selectedCase.last_seen_location
                  }
                </p>

              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Last Seen Date & Time
                </p>

                <p className="font-semibold">
                  {selectedCase.last_seen_date
                    ? new Date(
                        selectedCase.last_seen_date
                      ).toLocaleString()
                    : "-"}
                </p>

              </div>

              <div>

                <p className="text-sm text-gray-500 mb-1">
                  Current Status
                </p>

                <StatusBadge
                  status={
                    selectedCase.status
                  }
                />

              </div>

            </div>

            <div>

              <p className="text-sm text-gray-500 mb-2">
                Description
              </p>

              <div className="border rounded-lg p-4 bg-gray-50 min-h-[120px]">
                {selectedCase.description ||
                  "No additional information available."}
              </div>

            </div>

          </div>

          <div className="mt-6 border rounded-xl p-5 bg-blue-50">

            <h3 className="text-lg font-bold mb-4">
              Update Case Status
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">

              <select
                value={newStatus}
                onChange={(e) =>
                  setNewStatus(
                    e.target.value
                  )
                }
                className="flex-1 border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="active">
                  Active
                </option>

                <option value="found">
                  Found
                </option>

                <option value="closed">
                  Closed
                </option>

              </select>

              <button
                onClick={
                  handleUpdate
                }
                disabled={
                  newStatus ===
                  selectedCase.status
                }
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg font-medium"
              >
                Update Status
              </button>

            </div>

          </div>

          <div className="mt-6">

            <p className="text-sm text-gray-500 mb-2">
              Photograph
            </p>

            <div className="border rounded-xl p-4 bg-gray-50">

              {selectedCase.photo_path ? (

                <div className="text-center">

                  <p className="text-green-600 font-medium mb-3">
                    ✓ Photo uploaded
                  </p>

                  <img
                    src={getPhotoUrl(
                      selectedCase.photo_path
                    )}
                    alt={
                      selectedCase.name ||
                      "Missing Person"
                    }
                    className="max-h-96 max-w-full mx-auto rounded-xl object-contain border"
                    onLoad={() => {
                      console.log(
                        "Photo loaded:",
                        getPhotoUrl(
                          selectedCase.photo_path
                        )
                      );
                    }}
                    onError={(e) => {
                      console.error(
                        "Photo failed to load:",
                        getPhotoUrl(
                          selectedCase.photo_path
                        )
                      );

                      e.currentTarget.style.display =
                        "none";

                      const errorMessage =
                        e.currentTarget
                          .parentElement
                          ?.querySelector(
                            ".photo-error"
                          );

                      if (
                        errorMessage
                      ) {
                        errorMessage.style.display =
                          "block";
                      }
                    }}
                  />

                  <p className="photo-error hidden text-red-600 text-sm mt-3">
                    Unable to display the photograph.
                  </p>

                  <p className="text-xs text-gray-400 mt-3 break-all">
                    {getPhotoUrl(
                      selectedCase.photo_path
                    )}
                  </p>

                </div>

              ) : (

                <p className="text-gray-500 text-center py-8">
                  No photograph available
                </p>

              )}

            </div>

          </div>

        </div>

        <div className="border-t p-4 flex justify-end">

          <button
            onClick={() =>
              setSelectedCase(null)
            }
            className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-lg"
          >
            Close Details
          </button>

        </div>

      </div>

    </div>
  );
}

// =========================================================
// DASHBOARD CARD
// =========================================================

function DashboardCard({
  title,
  value,
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">

      <p className="text-gray-500">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>

    </div>
  );
}

// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({
  status,
}) {
  let className =
    "px-3 py-1 rounded-full text-sm font-medium";

  if (status === "pending") {
    className +=
      " bg-yellow-100 text-yellow-800";
  } else if (
    status === "approved" ||
    status === "active" ||
    status === "found"
  ) {
    className +=
      " bg-green-100 text-green-800";
  } else if (
    status === "rejected" ||
    status === "closed"
  ) {
    className +=
      " bg-red-100 text-red-800";
  } else {
    className +=
      " bg-gray-100 text-gray-700";
  }

  return (
    <span className={className}>
      {status}
    </span>
  );
}

// =========================================================
// PUBLIC REPORTS REVIEW
// =========================================================

function PublicReportsReview({
  publicReports,
  handleReportAction,
}) {
  return (
    <div className="bg-white overflow-hidden">

      <div className="p-6">

        <div className="flex justify-between items-center">

          <div>

            <h2 className="text-xl font-bold">
              Public Reports Review
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Review reports submitted by
              public users.
            </p>

          </div>

          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">

            {
              publicReports.filter(
                (report) =>
                  report.status ===
                  "pending"
              ).length
            }{" "}
            Pending

          </div>

        </div>

      </div>

      {publicReports.length ===
      0 ? (

        <div className="p-6 text-center text-gray-500">
          No public reports found.
        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="p-3 text-left">
                  ID
                </th>

                <th className="p-3 text-left">
                  Missing Person
                </th>

                <th className="p-3 text-left">
                  Age
                </th>

                <th className="p-3 text-left">
                  Gender
                </th>

                <th className="p-3 text-left">
                  Location
                </th>

                <th className="p-3 text-left">
                  Last Seen
                </th>

                <th className="p-3 text-left">
                  Reporter
                </th>

                <th className="p-3 text-left">
                  Description
                </th>

                <th className="p-3 text-left">
                  Photo
                </th>

                <th className="p-3 text-left">
                  Status
                </th>

                <th className="p-3 text-left">
                  Official Case
                </th>

                <th className="p-3 text-left">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {publicReports.map(
                (report) => (

                  <tr
                    key={
                      report.id
                    }
                    className="border-t"
                  >

                    <td className="p-3">
                      {report.id}
                    </td>

                    <td className="p-3 font-medium">
                      {
                        report.missing_person_name
                      }
                    </td>

                    <td className="p-3">
                      {report.age}
                    </td>

                    <td className="p-3">
                      {report.gender}
                    </td>

                    <td className="p-3">
                      {
                        report.last_seen_location
                      }
                    </td>

                    <td className="p-3">
                      {report.last_seen_date
                        ? new Date(
                            report.last_seen_date
                          ).toLocaleString()
                        : "-"}
                    </td>

                    <td className="p-3">

                      <div>
                        {
                          report.reporter_name
                        }
                      </div>

                      <div className="text-xs text-gray-500">
                        {
                          report.reporter_email
                        }
                      </div>

                    </td>

                    <td className="p-3 max-w-xs">
                      {report.description ||
                        "No description"}
                    </td>

                    <td className="p-3">

                      {report.photo_path ? (

                        <span className="text-green-600 font-medium">
                          Uploaded
                        </span>

                      ) : (

                        <span className="text-gray-500">
                          No photo
                        </span>

                      )}

                    </td>

                    <td className="p-3">

                      <StatusBadge
                        status={
                          report.status
                        }
                      />

                    </td>

                    <td className="p-3">

                      {report.official_case_id ? (

                        <span className="text-green-700 font-medium">
                          #
                          {
                            report.official_case_id
                          }
                        </span>

                      ) : (

                        "-"
                      )}

                    </td>

                    <td className="p-3">

                      {report.status ===
                      "pending" ? (

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              handleReportAction(
                                report.id,
                                "approve"
                              )
                            }
                            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              handleReportAction(
                                report.id,
                                "reject"
                              )
                            }
                            className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>

                        </div>

                      ) : (

                        <span className="text-gray-500 text-sm">
                          Reviewed
                        </span>

                      )}

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}

// =========================================================
// MISSING PERSON FORM
// =========================================================

function MissingPersonForm({
  missingName,
  setMissingName,
  missingAge,
  setMissingAge,
  missingGender,
  setMissingGender,
  missingDescription,
  setMissingDescription,
  lastSeenLocation,
  setLastSeenLocation,
  lastSeenDate,
  setLastSeenDate,
  setMissingPhoto,
  handleSubmit,
  title,
}) {
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow mb-8 space-y-4"
    >

      <h2 className="text-xl font-bold">
        {title}
      </h2>

      <input
        type="text"
        placeholder="Full Name"
        value={missingName}
        onChange={(e) =>
          setMissingName(
            e.target.value
          )
        }
        className="w-full border rounded-lg p-3"
        required
      />

      <input
        type="number"
        placeholder="Age"
        value={missingAge}
        onChange={(e) =>
          setMissingAge(
            e.target.value
          )
        }
        className="w-full border rounded-lg p-3"
        min="0"
        required
      />

      <select
        value={missingGender}
        onChange={(e) =>
          setMissingGender(
            e.target.value
          )
        }
        className="w-full border rounded-lg p-3"
      >

        <option value="Male">
          Male
        </option>

        <option value="Female">
          Female
        </option>

        <option value="Other">
          Other
        </option>

      </select>

      <input
        type="text"
        placeholder="Last Seen Location"
        value={
          lastSeenLocation
        }
        onChange={(e) =>
          setLastSeenLocation(
            e.target.value
          )
        }
        className="w-full border rounded-lg p-3"
        required
      />

      <input
        type="datetime-local"
        value={lastSeenDate}
        onChange={(e) =>
          setLastSeenDate(
            e.target.value
          )
        }
        className="w-full border rounded-lg p-3"
        required
      />

      <textarea
        placeholder="Description"
        value={
          missingDescription
        }
        onChange={(e) =>
          setMissingDescription(
            e.target.value
          )
        }
        className="w-full border rounded-lg p-3"
        rows="4"
      />

      <div>

        <label className="block font-medium mb-2">
          Photograph
        </label>

        <input
          id="missing-photo"
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) =>
            setMissingPhoto(
              e.target.files[0]
            )
          }
          className="w-full border rounded-lg p-3"
          required
        />

        <p className="text-sm text-gray-500 mt-1">
          JPG, JPEG, PNG or WEBP
        </p>

      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-5 py-3 rounded-lg"
      >
        Submit Missing Person Case
      </button>

    </form>
  );
}

export default App;