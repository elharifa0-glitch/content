import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "./supabaseClient";
import PlanPicker from "./PlanPicker";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Plus, X, Calendar as CalendarIcon, LayoutGrid, Home, Trash2, Pencil,
  ChevronRight, ChevronLeft, Check, Clock, Sparkles, CheckCircle2, Circle,
  Loader2, Save, Link2, ExternalLink, BarChart3,
  AlertTriangle, Eye, Wallet, Hash, Copy, Repeat, BookOpen, Award, Banknote,
  Users, TrendingUp, ThumbsUp, Search, Target, MessageCircle,
  ListPlus, ClipboardList, Download, FileText, Scale, Bell, BellOff, Minus, Share2,
  ArrowUpRight, ArrowDownRight, ListChecks, CalendarClock, Menu, LogOut, Crown, Sun, Moon,
} from "lucide-react";
import { colors, radius, spacing, shadows, transitions, softBg, borderTint } from "./theme";
import { Button, Badge } from "./components";
import { useTheme } from "./ThemeContext";

const PALETTE = [
  "#E7A33E", "#4FB286", "#5FA8D3", "#D9707A",
  "#9B7FD4", "#63C2C9", "#C97B5F", "#8FA0A8",
];

const EMOJI_OPTIONS = ["🟠", "🟢", "🔵", "🟣", "🟡", "🔴", "⚪️", "⚫️", "🟤"];

const STATUS_DEFS = [
  { key: "idea", label: "فكرة جديدة", color: colors.status.idea, bg: softBg.default },
  { key: "ready", label: "جاهزة", color: colors.status.ready, bg: softBg.info },
  { key: "scheduled", label: "مجدولة", color: colors.status.scheduled, bg: softBg.warning },
  { key: "done", label: "اتنشرت", color: colors.status.done, bg: softBg.success },
];

const TYPE_OPTIONS = ["بوست", "ريلز", "ستوري", "فيديو", "كاروسيل", "مقال", "تانى"];

const PLAN_LIMITS = { starter: 2, pro: 5, unlimited: Infinity };
const PLAN_LABELS = { starter: "Starter", pro: "Pro", unlimited: "Unlimited" };
const PLAN_COLORS = { starter: colors.info, pro: colors.warning, unlimited: colors.good };
function planColor(p) {
  const n = (p || "").toString().trim().toLowerCase();
  return PLAN_COLORS[n] || colors.textFaint;
}
function planLabel(p) {
  const n = (p || "").toString().trim().toLowerCase();
  return PLAN_LABELS[n] || p;
}
const UPGRADE_WHATSAPP = "201148769364";

const MONTHS_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];
const WEEKDAYS_AR = ["حد","اتنين","تلات","أربع","خميس","جمعة","سبت"];

function uid() {
  return (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function isoFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayISO() { return isoFromDate(new Date()); }

function fmtDate(d) {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getDate()} ${MONTHS_AR[dt.getMonth()]}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(todayISO() + "T00:00:00");
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d - today) / 86400000);
}

// أي فكرة عندها ديدلاين ومحدد لها "ذكّرني قبله بكام يوم"، وده اليوم بالظبط
function getTodaysReminders(items) {
  return items.filter((it) => {
    if (!it.date || it.reminderDays === undefined || it.reminderDays === null || it.status === "done") return false;
    const left = daysUntil(it.date);
    return left !== null && left === Number(it.reminderDays);
  });
}

function normalizeUrl(u) {
  if (!u) return "";
  const trimmed = u.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function fmtMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("ar-EG");
}

export default function ContentStudio({
  session, onSignOut, plan, isTrialing, trialEndsAt, currentPeriodEnd, hasSubRow, onSubscriptionRecheck,
}) {
  const userId = session.user.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState([]);
  const [items, setItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("dashboard");
  const [brandTab, setBrandTab] = useState("board");
  const [brandModal, setBrandModal] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const normalizedPlan = (plan || "").toString().trim().toLowerCase();
  const brandLimit = isTrialing ? Infinity : (PLAN_LIMITS[normalizedPlan] ?? Infinity);
  const brandLimitReached = brands.length >= brandLimit;

  function handleAddBrandClick() {
    if (brandLimitReached) {
      setLimitModalOpen(true);
    } else {
      setBrandModal({});
    }
  }

  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((perm) => setNotifPermission(perm));
  }

  // كل ما تفتح الأداة (أو أي فكرة تتحدّث)، بنشوف لو فيه تذكيرات مستحقة النهاردة
  // ولو المستخدم مفعّل التنبيهات، بنطلعله إشعار حقيقي من المتصفح لكل واحدة لسه ما اتبعتلوش
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const todays = getTodaysReminders(items);
    const today = todayISO();
    for (const it of todays) {
      const key = `reminder-notified-${it.id}-${today}`;
      if (localStorage.getItem(key)) continue;
      try {
        new Notification("تذكير من استوديو الشغل", {
          body: `"${it.title}" — الميعاد بعد ${it.reminderDays} يوم`,
          tag: key,
        });
        localStorage.setItem(key, "1");
      } catch (e) {
        // بعض المتصفحات بترفض إشعارات من غير تفاعل مستخدم، تجاهل بهدوء
      }
    }
  }, [items]);

  useEffect(() => {
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from("user_data")
          .select("data")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        if (row?.data) {
          const parsed = row.data;
          const rawItems = parsed.items || [];
          const seen = new Set();
          let repaired = false;
          const fixedItems = rawItems.map((it) => {
            let out = it;
            if (!out.id || seen.has(out.id)) {
              repaired = true;
              out = { ...out, id: uid() };
            }
            seen.add(out.id);
            if (out.metric !== undefined && out.views === undefined) {
              const { metric, ...rest } = out;
              out = { ...rest, views: metric };
              repaired = true;
            }
            return out;
          });
          setBrands(parsed.brands || []);
          setItems(fixedItems);
          setTasks(parsed.tasks || []);
          if (repaired) {
            try {
              await supabase.from("user_data").upsert({
                user_id: userId,
                data: { brands: parsed.brands || [], items: fixedItems, tasks: parsed.tasks || [] },
                updated_at: new Date().toISOString(),
              });
            } catch (e2) {
              // best effort repair, will retry on next edit anyway
            }
          }
        }
      } catch (e) {
        console.error("تعذر تحميل البيانات", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const persist = useCallback(async (nextBrands, nextItems, nextTasks) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("user_data").upsert({
        user_id: userId,
        data: { brands: nextBrands, items: nextItems, tasks: nextTasks },
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (e) {
      console.error("تعذر الحفظ", e);
    } finally {
      setSaving(false);
    }
  }, [userId]);

  const updateBrands = (next) => { setBrands(next); persist(next, items, tasks); };
  const updateItems = (next) => { setItems(next); persist(brands, next, tasks); };
  const updateTasks = (next) => { setTasks(next); persist(brands, items, next); };

  const activeBrandId = view.startsWith("brand:") ? view.slice(6) : null;
  const activeBrand = brands.find((b) => b.id === activeBrandId) || null;

  const brandCounts = useMemo(() => {
    const map = {};
    for (const b of brands) map[b.id] = { idea: 0, ready: 0, scheduled: 0, done: 0 };
    for (const it of items) {
      if (map[it.brandId]) map[it.brandId][it.status] = (map[it.brandId][it.status] || 0) + 1;
    }
    return map;
  }, [brands, items]);

  const weekPriorities = useMemo(() => {
    const t = todayISO();
    const end = new Date(); end.setDate(end.getDate() + 7);
    const endStr = isoFromDate(end);
    return items
      .filter((it) => it.date && it.date >= t && it.date <= endStr && it.status !== "done")
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items]);

  const overdueCount = useMemo(() => {
    const t = todayISO();
    return items.filter((it) => it.date && it.date < t && it.status !== "done").length;
  }, [items]);

  function saveBrand(data) {
    if (data.id) {
      updateBrands(brands.map((b) => (b.id === data.id ? { ...b, ...data } : b)));
    } else {
      const nb = {
        id: uid(), name: data.name, emoji: data.emoji, color: data.color, handle: data.handle || "",
        hashtags: "", captionTemplates: {}, evergreenIdeas: [], paymentTotal: 0, payments: [],
        referenceSources: [], pageLink: "", pageSnapshots: [],
      };
      updateBrands([...brands, nb]);
      setView(`brand:${nb.id}`);
      setBrandTab("board");
    }
    setBrandModal(null);
  }

  function patchBrand(id, patch) {
    updateBrands(brands.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function deleteBrand(id) {
    updateBrands(brands.filter((b) => b.id !== id));
    updateItems(items.filter((it) => it.brandId !== id));
    if (activeBrandId === id) setView("dashboard");
    setConfirmDelete(null);
  }

  function saveItem(data) {
    if (data.id) {
      updateItems(items.map((it) => (it.id === data.id ? { ...it, ...data } : it)));
    } else {
      const { id: _drop, ...rest } = data;
      updateItems([...items, { id: uid(), ...rest }]);
    }
    setItemModal(null);
  }

  function deleteItem(id) {
    updateItems(items.filter((it) => it.id !== id));
    setConfirmDelete(null);
  }

  function setItemStatus(id, status) {
    updateItems(items.map((it) => (it.id === id ? { ...it, status } : it)));
  }

  function patchItem(id, patch) {
    updateItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addTask(text) {
    const t = text.trim();
    if (!t) return;
    updateTasks([{ id: uid(), text: t, done: false }, ...tasks]);
  }
  function toggleTask(id) {
    updateTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  function deleteTask(id) {
    updateTasks(tasks.filter((t) => t.id !== id));
  }

  function bulkAddItems(brandId, titles, type, status) {
    const newItems = titles
      .map((t) => t.trim())
      .filter(Boolean)
      .map((title) => ({ id: uid(), brandId, title, notes: "", link: "", referenceLink: "", type, status, date: "" }));
    if (newItems.length) updateItems([...items, ...newItems]);
    setBulkAddOpen(false);
  }

  function openPrefilledIdea(brandId, title, notes) {
    setItemModal({ brandId: brandId || activeBrandId || brands[0]?.id, title, notes });
  }

  if (loading) {
    return (
      <div style={S.loadingWrap}>
        <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ marginRight: 10 }}>بيحمّل الاستوديو...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div dir="rtl" style={S.app} className="studio-app">
      <style>{`
        /* Font import, theme variables, focus rings, keyframes and scrollbar
           styling are injected once, app-wide, by ThemeProvider — see
           src/ThemeContext.jsx / src/globalStyles.js. What's left here is
           purely this screen's own layout/responsive rules. */

        /* ---------- Responsive layout ---------- */
        .studio-app,
        .studio-app * { min-width: 0; }

        .cs-topbar-menu-btn { display: none; }
        .cs-sidebar-close-btn { display: none; }

        @media (max-width: 900px) {
          .studio-main {
            padding: 20px !important;
          }
          .studio-app .dashGrid {
            grid-template-columns: 1fr !important;
          }
          .studio-app .dashTwoCol {
            grid-template-columns: 1fr !important;
          }
          .studio-app .perfTotalsGrid {
            grid-template-columns: 1fr !important;
          }

          /* Sidebar becomes an off-canvas drawer anchored to the right —
             matches where it already lives in this RTL layout — instead
             of squeezing into the row or becoming a horizontal strip. */
          .cs-topbar-menu-btn { display: flex !important; }
          .cs-sidebar-close-btn { display: flex !important; }
          .studio-sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            right: 0;
            width: min(84vw, 300px) !important;
            max-height: none !important;
            z-index: 55;
            border-radius: 0 !important;
            transform: translateX(100%);
            transition: transform ${transitions.slow};
            box-shadow: -16px 0 40px rgba(3,5,12,0.55);
          }
          .studio-sidebar.cs-sidebar-open {
            transform: translateX(0);
          }
        }

        @media (max-width: 700px) {
          .studio-app {
            display: block !important;
            width: 100% !important;
            min-height: 100vh !important;
            border-radius: 0 !important;
            border-left: 0 !important;
            border-right: 0 !important;
            overflow: visible !important;
          }

          .studio-main {
            width: 100% !important;
            max-height: none !important;
            min-height: calc(100vh - 160px) !important;
            padding: 16px 12px 28px !important;
            overflow-x: hidden !important;
            overflow-y: visible !important;
          }

          .studio-app .sectionHeader {
            align-items: flex-start !important;
            gap: 9px !important;
            margin-bottom: 16px !important;
          }
          .studio-app .sectionHeaderTitle {
            font-size: 17px !important;
          }
          .studio-app .sectionHeaderSub {
            font-size: 11.5px !important;
          }

          .studio-app .statRow {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            margin-bottom: 18px !important;
          }
          .studio-app .statCard {
            padding: 11px 10px !important;
          }
          .studio-app .statValue {
            font-size: 19px !important;
          }
          .studio-app .statLabel {
            font-size: 10.5px !important;
          }

          .studio-app .dashGrid,
          .studio-app .dashTwoCol,
          .studio-app .perfTotalsGrid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }

          .studio-app .kpiRow,
          .studio-app .financeRow {
            grid-template-columns: 1fr 1fr !important;
          }

          .studio-app .topHeader {
            flex-wrap: wrap !important;
            gap: 10px !important;
          }

          .studio-app .brandCardGrid {
            grid-template-columns: 1fr !important;
          }

          .studio-app .searchBar {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }
          .studio-app .searchBar > * {
            width: 100% !important;
            min-width: 0 !important;
          }

          .studio-app .idBadgeInner {
            padding: 12px !important;
          }
          .studio-app .idBadgeName {
            font-size: 15px !important;
          }
          .studio-app .idBadgeHandle {
            font-size: 11px !important;
          }

          .studio-app .tabRow {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 6px !important;
          }
          .studio-app .tabRow > div {
            display: none !important;
          }
          .studio-app .tabRow button {
            width: 100% !important;
            justify-content: center !important;
            padding: 9px 7px !important;
            font-size: 11.5px !important;
          }
          .studio-app .tabRow button:nth-of-type(n+6) {
            grid-column: 1 / -1;
          }

          .studio-app .board {
            grid-template-columns: 1fr !important;
            overflow-x: visible !important;
            gap: 10px !important;
          }
          .studio-app .column {
            min-width: 0 !important;
            max-height: none !important;
          }
          .studio-app .columnBody {
            max-height: 480px !important;
          }

          .studio-app .ticketFooter {
            gap: 8px !important;
            align-items: flex-start !important;
            flex-wrap: wrap !important;
          }
          .studio-app .perfInputsRow {
            grid-template-columns: 1fr !important;
          }

          .studio-app .calGrid {
            gap: 3px !important;
          }
          .studio-app .calCell,
          .studio-app .calCellEmpty {
            min-height: 58px !important;
          }
          .studio-app .calCell {
            padding: 4px !important;
          }
          .studio-app .calDayNum {
            font-size: 10px !important;
          }
          .studio-app .calChip {
            font-size: 8px !important;
            padding: 2px 3px !important;
          }
          .studio-app .calWeekday {
            font-size: 9px !important;
          }
          .studio-app .calHeader {
            gap: 10px !important;
          }

          .studio-app .rowTwo {
            grid-template-columns: 1fr !important;
          }

          .studio-app .modal {
            width: calc(100vw - 24px) !important;
            max-width: none !important;
            max-height: calc(100vh - 24px) !important;
            padding: 14px !important;
            border-radius: 12px !important;
          }
          .studio-app .overlay {
            padding: 12px !important;
            align-items: center !important;
          }
          .studio-app .modalFooter {
            flex-wrap: wrap !important;
          }
          .studio-app .modalFooter button {
            flex: 1 1 120px !important;
          }

          .studio-app .compareTable {
            min-width: 520px !important;
          }
        }

        @media (max-width: 380px) {
          .studio-main {
            padding-left: 9px !important;
            padding-right: 9px !important;
          }
          .studio-app .statRow {
            grid-template-columns: 1fr 1fr !important;
            gap: 6px !important;
          }
          .studio-app .statValue {
            font-size: 17px !important;
          }
          .studio-app .tabRow button {
            font-size: 10.5px !important;
          }
        }

      `}</style>

      <Sidebar
        brands={brands}
        view={view}
        setView={(v) => { setView(v); setBrandTab("board"); setSidebarOpen(false); }}
        onAddBrand={handleAddBrandClick}
        saving={saving}
        userEmail={session.user.email}
        onSignOut={() => setConfirmSignOut(true)}
        plan={plan}
        isTrialing={isTrialing}
        brandLimit={brandLimit}
        notifPermission={notifPermission}
        onRequestNotifPermission={requestNotifPermission}
        onDeleteBrand={(b) => setConfirmDelete({ type: "brand", id: b.id, label: b.name })}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <div
        className={`cs-sidebar-backdrop ${sidebarOpen ? "cs-open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <main style={S.main} className="scrollbar studio-main">
        <TopHeader
          session={session}
          plan={plan}
          isTrialing={isTrialing}
          items={items}
          onOpenSearch={() => setView("search")}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        {view === "dashboard" && (
          <Dashboard
            brands={brands}
            items={items}
            brandCounts={brandCounts}
            weekPriorities={weekPriorities}
            overdueCount={overdueCount}
            onOpenBrand={(id) => setView(`brand:${id}`)}
            onAddBrand={handleAddBrandClick}
            tasks={tasks}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        )}

        {view === "calendar" && (
          <div style={S.section}>
            <SectionHeader icon={<CalendarIcon size={20} />} title="التقويم العام" subtitle="كل البراندات مع بعض، كل واحد بلونه" />
            <MonthCalendar
              items={items}
              brands={brands}
              month={calMonth}
              setMonth={setCalMonth}
              onDayClick={(date) => setItemModal({ date })}
              onItemClick={(it) => setItemModal(it)}
              showBrandColor
            />
          </div>
        )}

        {view === "search" && (
          <SearchView items={items} brands={brands} onOpenItem={(it) => setItemModal(it)} />
        )}

        {view === "compare" && (
          <CompareView brands={brands} items={items} onOpenBrand={(id) => setView(`brand:${id}`)} />
        )}

        {view === "account" && (
          <AccountView
            plan={plan}
            isTrialing={isTrialing}
            trialEndsAt={trialEndsAt}
            currentPeriodEnd={currentPeriodEnd}
            hasSubRow={hasSubRow}
            brandsCount={brands.length}
            brandLimit={brandLimit}
            onRecheck={onSubscriptionRecheck}
          />
        )}

        {activeBrand && (
          <BrandPage
            brand={activeBrand}
            items={items.filter((it) => it.brandId === activeBrand.id)}
            tab={brandTab}
            setTab={setBrandTab}
            onEditBrand={() => setBrandModal(activeBrand)}
            onDeleteBrand={() => setConfirmDelete({ type: "brand", id: activeBrand.id, label: activeBrand.name })}
            onAddItem={() => setItemModal({ brandId: activeBrand.id })}
            onBulkAdd={() => setBulkAddOpen(true)}
            onEditItem={(it) => setItemModal(it)}
            onDeleteItem={(it) => setConfirmDelete({ type: "item", id: it.id, label: it.title })}
            onSetStatus={setItemStatus}
            onPatchItem={patchItem}
            onPatchBrand={patchBrand}
            onUseIdea={openPrefilledIdea}
            calMonth={calMonth}
            setCalMonth={setCalMonth}
          />
        )}
      </main>

      {brandModal !== null && (
        <BrandModal brand={brandModal.id ? brandModal : null} onClose={() => setBrandModal(null)} onSave={saveBrand} />
      )}

      {itemModal !== null && (
        <ItemModal
          item={itemModal.id ? itemModal : null}
          brands={brands}
          defaultBrandId={itemModal.brandId || activeBrandId || brands[0]?.id}
          defaultDate={itemModal.date}
          defaultTitle={itemModal.title}
          defaultNotes={itemModal.notes}
          onClose={() => setItemModal(null)}
          onSave={saveItem}
        />
      )}

      {bulkAddOpen && (
        <BulkAddModal
          brand={activeBrand}
          onClose={() => setBulkAddOpen(false)}
          onSave={(titles, type, status) => bulkAddItems(activeBrand.id, titles, type, status)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          text={
            confirmDelete.type === "brand"
              ? `هتمسح براند "${confirmDelete.label}" وكل الأفكار اللي جواه. الخطوة دي مفيهاش رجوع.`
              : `هتمسح "${confirmDelete.label}". الخطوة دي مفيهاش رجوع.`
          }
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => (confirmDelete.type === "brand" ? deleteBrand(confirmDelete.id) : deleteItem(confirmDelete.id))}
        />
      )}

      {confirmSignOut && (
        <ConfirmModal
          text="هتخرج من حسابك دلوقتي. تقدر تسجل دخول تاني أي وقت بنفس الإيميل والباسورد."
          confirmLabel="سجّل خروج"
          danger={false}
          onCancel={() => setConfirmSignOut(false)}
          onConfirm={() => { setConfirmSignOut(false); onSignOut(); }}
        />
      )}

      {limitModalOpen && (
        <ModalShell onClose={() => setLimitModalOpen(false)}>
          <div style={S.modalTitle}>وصلت لأقصى عدد براندات في باقتك</div>
          <p style={S.confirmText}>
            باقتك الحالية ({planLabel(plan) || "الحالية"}) بتسمح بـ{" "}
            {brandLimit === Infinity ? "براندات غير محدودة" : `${brandLimit} براندات`} بس، وإنت وصلت للحد ده.
            رقّي باقتك عشان تضيف براندات أكتر.
          </p>
          {brands.length > brandLimit && (
            <p style={{ ...S.confirmText, color: colors.good, fontSize: 12 }}>
              اطمّن: البراندات الزيادة من فترة التجربة مش هتتمسح ولا تختفي — هتفضل موجودة وتقدر تشتغل عليها زي ما هي، بس مش هتقدر تضيف واحد جديد لحد ما ترقّي أو تمسح واحد قديم.
            </p>
          )}
          <div style={S.modalFooter}>
            <button onClick={() => setLimitModalOpen(false)} style={S.secondaryBtn}>رجوع</button>
            <a
              href={`https://wa.me/${UPGRADE_WHATSAPP}?text=${encodeURIComponent("أهلاً، عايز أرقّي باقتي في استوديو الشغل.")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...S.primaryBtn(colors.warning), textDecoration: "none" }}
            >
              رقّي الباقة
            </a>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ---------- Sidebar ---------- */

function Sidebar({
  brands, view, setView, onAddBrand, saving, userEmail, onSignOut, plan, isTrialing, brandLimit,
  notifPermission, onRequestNotifPermission, onDeleteBrand, mobileOpen, onCloseMobile,
}) {
  return (
    <aside
      style={S.sidebar}
      className={`scrollbar studio-sidebar${mobileOpen ? " cs-sidebar-open" : ""}`}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={S.brandMark}>
          <div style={S.brandMarkDot} />
          <div>
            <div style={S.brandMarkTitle}>استوديو الشغل</div>
            <div style={S.brandMarkSub}>
              <span style={{ ...S.syncDot, background: saving ? colors.warning : colors.good }} />
              {saving ? "بيحفظ..." : "متزامن"}
            </div>
          </div>
        </div>
        <button onClick={onCloseMobile} className="cs-icon-btn cs-sidebar-close-btn" style={S.sidebarCloseBtn} aria-label="اقفل القائمة">
          <X size={16} />
        </button>
      </div>

      {notifPermission !== "unsupported" && notifPermission !== "granted" && (
        <button onClick={onRequestNotifPermission} style={S.notifBtn}>
          <Bell size={13} /> فعّل تنبيهات الديدلاين
        </button>
      )}

      <nav className="studio-nav" style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem icon={<Home size={17} />} label="الرئيسية" active={view === "dashboard"} onClick={() => setView("dashboard")} />
        <NavItem icon={<CalendarIcon size={17} />} label="التقويم العام" active={view === "calendar"} onClick={() => setView("calendar")} />
        <NavItem icon={<Search size={17} />} label="بحث في كل الأفكار" active={view === "search"} onClick={() => setView("search")} />
        <NavItem icon={<BarChart3 size={17} />} label="مقارنة البراندات" active={view === "compare"} onClick={() => setView("compare")} />
        <NavItem icon={<Wallet size={17} />} label="الاشتراك والباقة" active={view === "account"} onClick={() => setView("account")} />
      </nav>

      {view !== "account" && (
        <Button variant="primary" fullWidth style={{ marginTop: 12 }} icon={<Crown size={14} />} onClick={() => setView("account")}>
          {isTrialing || !plan ? "اشترك دلوقتي" : "رقّي باقتك"}
        </Button>
      )}

      <div style={S.sidebarDivider} />

      <div style={S.sidebarLabelRow}>
        <span style={S.sidebarLabel}>
          البراندات
          {!isTrialing && brandLimit !== Infinity && ` (${brands.length}/${brandLimit})`}
          {plan && !isTrialing && (
            <> · <span style={{ color: planColor(plan), fontWeight: 800 }}>{planLabel(plan) || plan}</span></>
          )}
          {!plan && !isTrialing && <span style={{ color: colors.danger }}> · مفيش باقة مسجلة</span>}
        </span>
        <button onClick={onAddBrand} className="cs-icon-btn" style={S.iconBtnSm} title="ضيف براند"><Plus size={15} /></button>
      </div>

      <div className="studio-brand-list">
        {brands.length === 0 && <div style={S.emptyBrands}>لسه مفيش براندات. دوس + عشان تضيف أول واحد.</div>}
        {brands.map((b) => (
          <div key={b.id} style={S.brandTabRow}>
            <button
              onClick={() => setView(`brand:${b.id}`)}
              style={{ ...S.brandTab, ...(view === `brand:${b.id}` ? S.brandTabActive(b.color) : {}) }}
            >
              <span style={{ ...S.brandTabStripe, background: b.color }} />
              <span style={S.brandTabEmoji}>{b.emoji}</span>
              <span style={S.brandTabName}>{b.name}</span>
            </button>
            <button onClick={() => onDeleteBrand(b)} className="cs-icon-btn" style={S.brandDeleteBtn} title="امسح البراند">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div style={S.sidebarDivider} />
      <div style={S.sidebarAccount} className="studio-account">
        <span style={S.sidebarAccountEmail}>{userEmail}</span>
        <Button variant="ghost" size="sm" icon={<LogOut size={13} />} onClick={onSignOut}>تسجيل خروج</Button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="cs-nav-item" style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }}>
      {active && <span style={S.navItemIndicator} />}
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ---------- Top header (avatar, plan badge, search shortcut, notifications) ---------- */

function TopHeader({ session, plan, isTrialing, items, onOpenSearch, onOpenSidebar }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { mode, toggleTheme } = useTheme();
  const today = todayISO();

  const overdueItems = useMemo(
    () => items.filter((i) => i.date && i.date < today && i.status !== "done"),
    [items, today]
  );
  const todaysReminders = useMemo(() => getTodaysReminders(items), [items]);
  const attentionList = useMemo(() => [...overdueItems, ...todaysReminders].slice(0, 6), [overdueItems, todaysReminders]);
  const attentionCount = overdueItems.length + todaysReminders.length;

  const emailName = (session?.user?.email || "").split("@")[0] || "مستخدم";
  const initial = emailName.charAt(0).toUpperCase();

  return (
    <div style={S.topHeader} className="topHeader">
      <div style={S.topHeaderUser}>
        <button onClick={onOpenSidebar} className="cs-icon-btn cs-topbar-menu-btn" style={S.topHeaderIconBtn} aria-label="افتح القائمة الجانبية">
          <Menu size={17} />
        </button>
        <div style={S.topHeaderAvatar}>{initial}</div>
        <div>
          <div style={S.topHeaderName}>{emailName}</div>
          {isTrialing ? (
            <Badge tone="warning" style={{ marginTop: 2 }}>تجربة مجانية</Badge>
          ) : plan ? (
            <Badge color={planColor(plan)} style={{ marginTop: 2 }}>باقة {planLabel(plan)}</Badge>
          ) : null}
        </div>
      </div>

      <div style={S.topHeaderActions}>
        <button
          onClick={toggleTheme}
          className="cs-icon-btn"
          style={S.topHeaderIconBtn}
          aria-label="تبديل المظهر"
          title="تبديل المظهر"
        >
          {mode === "dark" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button onClick={onOpenSearch} className="cs-icon-btn" style={S.topHeaderIconBtn} title="بحث في كل الأفكار">
          <Search size={16} />
        </button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setNotifOpen((o) => !o)} className="cs-icon-btn" style={S.topHeaderIconBtn} title="يحتاج انتباهك">
            <Bell size={16} />
            {attentionCount > 0 && <span style={S.topHeaderBadge}>{attentionCount}</span>}
          </button>
          {notifOpen && (
            <div style={S.notifDropdown} className="cs-animate-fade">
              <div style={S.notifDropdownTitle}>يحتاج انتباهك</div>
              {attentionList.length === 0 && <p style={S.aiHint}>مفيش حاجة مستعجلة دلوقتي 👍</p>}
              {attentionList.map((it) => (
                <div key={it.id} style={S.notifRow}>
                  <span style={{ ...S.dot, background: colors.danger, flexShrink: 0 }} />
                  <span style={S.notifRowText}>{it.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ brands, items, brandCounts, weekPriorities, overdueCount, onOpenBrand, onAddBrand, tasks, onAddTask, onToggleTask, onDeleteTask }) {
  const totalOpen = items.filter((i) => i.status !== "done").length;
  const [newTask, setNewTask] = useState("");
  const today = todayISO();
  const monthPrefix = today.slice(0, 7);

  const prevMonthPrefix = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return isoFromDate(d).slice(0, 7);
  }, []);

  let monthIncome = 0;
  let prevMonthIncome = 0;
  let totalIncome = 0;
  let totalRemaining = 0;
  let totalExpenses = 0;
  let monthExpenses = 0;
  brands.forEach((b) => {
    const payments = b.payments || [];
    const expenses = b.expenses || [];
    const received = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const spent = expenses.reduce((s, p) => s + Number(p.amount || 0), 0);
    totalIncome += received;
    totalExpenses += spent;
    totalRemaining += (Number(b.paymentTotal) || 0) - received;
    payments.forEach((p) => {
      if (!p.date) return;
      if (p.date.slice(0, 7) === monthPrefix) monthIncome += Number(p.amount || 0);
      if (p.date.slice(0, 7) === prevMonthPrefix) prevMonthIncome += Number(p.amount || 0);
    });
    expenses.forEach((p) => {
      if (p.date && p.date.slice(0, 7) === monthPrefix) monthExpenses += Number(p.amount || 0);
    });
  });
  const totalNetProfit = totalIncome - totalExpenses;
  const monthNet = monthIncome - monthExpenses;
  const incomeChangePct = prevMonthIncome > 0 ? Math.round(((monthIncome - prevMonthIncome) / prevMonthIncome) * 100) : null;

  function submitTask() {
    onAddTask(newTask);
    setNewTask("");
  }

  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);
  const todaysReminders = useMemo(() => getTodaysReminders(items), [items]);

  const todayContent = useMemo(
    () => items.filter((i) => i.date === today).sort((a, b) => (a.brandId || "").localeCompare(b.brandId || "")),
    [items, today]
  );

  const overdueItems = useMemo(
    () => items.filter((i) => i.date && i.date < today && i.status !== "done").sort((a, b) => a.date.localeCompare(b.date)),
    [items, today]
  );

  const attentionItems = useMemo(() => {
    const list = [];
    overdueItems.forEach((it) => list.push({ kind: "overdue", item: it }));
    todaysReminders.forEach((it) => list.push({ kind: "reminder", item: it }));
    return list.slice(0, 6);
  }, [overdueItems, todaysReminders]);

  const perfChartData = useMemo(() => {
    const map = {};
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    items.forEach((it) => {
      if (!it.date || it.views === undefined || it.views === null || it.views === "") return;
      const d = new Date(it.date + "T00:00:00");
      if (d < cutoff) return;
      map[it.date] = (map[it.date] || 0) + Number(it.views || 0);
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, views]) => ({ date: fmtDate(date), views }));
  }, [items]);

  return (
    <div style={S.section}>
      <div style={S.dashHeaderRow}>
        <div>
          <h2 style={S.dashGreeting}>أهلاً بيك 👋</h2>
          <p style={S.dashGreetingSub}>دي نظرة سريعة على شغلك النهارده.</p>
        </div>
      </div>

      {/* KPI summary — compact, at-a-glance */}
      <div style={S.kpiRow} className="kpiRow">
        <KpiCard label="البراندات" value={brands.length} icon={<Users size={15} />} />
        <KpiCard label="أفكار جديدة" value={items.filter((i) => i.status === "idea").length} icon={<Sparkles size={15} />} color={STATUS_DEFS[0].color} />
        <KpiCard label="محتوى مجدول" value={items.filter((i) => i.status === "scheduled").length} icon={<CalendarClock size={15} />} color={STATUS_DEFS[2].color} />
        <KpiCard label="محتوى متأخر" value={overdueCount} icon={<AlertTriangle size={15} />} color={overdueCount > 0 ? colors.danger : colors.good} />
      </div>

      {/* Financial overview */}
      {brands.length > 0 && (
        <div style={S.dashSection}>
          <h3 style={S.dashSectionTitle}><Banknote size={14} /> الوضع المالي</h3>
          <div style={S.financeRow} className="financeRow">
            <div style={S.financeCard}>
              <div style={S.financeLabel}>الدخل الشهر ده</div>
              <div style={S.financeValue}>{fmtMoney(monthIncome)}</div>
              {incomeChangePct !== null && (
                <div style={{ ...S.financeTrend, color: incomeChangePct >= 0 ? colors.good : colors.danger }}>
                  {incomeChangePct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(incomeChangePct)}% عن الشهر اللي فات
                </div>
              )}
            </div>
            <div style={S.financeCard}>
              <div style={S.financeLabel}>المصاريف الشهر ده</div>
              <div style={{ ...S.financeValue, color: colors.danger }}>{fmtMoney(monthExpenses)}</div>
            </div>
            <div style={S.financeCard}>
              <div style={S.financeLabel}>صافي الربح الشهر ده</div>
              <div style={{ ...S.financeValue, color: monthNet < 0 ? colors.danger : colors.good }}>{fmtMoney(monthNet)}</div>
            </div>
          </div>
          <div style={S.financeFooterRow}>
            <span>إجمالي كل الوقت: <b style={{ color: colors.text }}>{fmtMoney(totalIncome)}</b></span>
            <span>الصافي الكلي: <b style={{ color: totalNetProfit < 0 ? colors.danger : colors.good }}>{fmtMoney(totalNetProfit)}</b></span>
            <span>متبقي ليك: <b style={{ color: colors.warning }}>{fmtMoney(totalRemaining)}</b></span>
          </div>
        </div>
      )}

      {/* Performance chart */}
      {brands.length > 0 && (
        <div style={S.dashSection}>
          <h3 style={S.dashSectionTitle}><BarChart3 size={14} /> أداء المحتوى (آخر 30 يوم)</h3>
          {perfChartData.length > 1 ? (
            <div style={S.chartCard}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={perfChartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.warning} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={colors.warning} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                  <XAxis dataKey="date" stroke={colors.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={colors.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: colors.text }} itemStyle={{ color: colors.warning }} />
                  <Area type="monotone" dataKey="views" name="مشاهدات" stroke={colors.warning} strokeWidth={2} fill="url(#perfGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={S.chartCard}>
              <p style={S.aiHint}>سجّل المشاهدات في "نتيجة النشر" لأي فكرة عشان يبدأ يظهر هنا رسم بياني لأدائك بمرور الوقت.</p>
            </div>
          )}
        </div>
      )}

      <div style={S.dashTwoCol} className="dashTwoCol">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Today's content */}
          <div>
            <h3 style={S.dashSectionTitle}><ListChecks size={14} /> محتوى النهارده</h3>
            <div style={S.compactList}>
              {todayContent.length === 0 && <div style={S.emptyBrands}>مفيش محتوى مجدول النهارده.</div>}
              {todayContent.map((it) => {
                const b = brands.find((x) => x.id === it.brandId);
                const sd = STATUS_DEFS.find((s) => s.key === it.status);
                return (
                  <div key={it.id} style={S.compactRow}>
                    <span style={{ ...S.dot, background: b?.color || "#666" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.upcomingTitle}>{it.title}</div>
                      <div style={S.upcomingMeta}>{b?.name} · {it.type}</div>
                    </div>
                    <span style={{ ...S.miniBadge, color: sd?.color, background: sd?.bg }}>{sd?.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Needs attention */}
          <div>
            <h3 style={S.dashSectionTitle}><AlertTriangle size={14} color={colors.danger} /> يحتاج انتباهك</h3>
            <div style={S.compactList}>
              {attentionItems.length === 0 && <div style={S.emptyBrands}>مفيش حاجة مستعجلة دلوقتي — تمام كده 👍</div>}
              {attentionItems.map(({ kind, item: it }) => {
                const b = brands.find((x) => x.id === it.brandId);
                const dLeft = daysUntil(it.date);
                return (
                  <div key={`${kind}-${it.id}`} style={S.attentionRow}>
                    <span style={S.attentionIcon}><AlertTriangle size={13} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.upcomingTitle}>{it.title}</div>
                      <div style={S.upcomingMeta}>{b?.name}</div>
                    </div>
                    <span style={S.attentionTag}>
                      {kind === "overdue" ? `متأخرة ${Math.abs(dLeft)} يوم` : "تذكير النهاردة"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* General tasks (existing feature, preserved) */}
          <div>
            <h3 style={S.dashSectionTitle}><ClipboardList size={14} /> مهام عامة (برة الأفكار)</h3>
            <div style={S.refCard}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input
                  style={S.input}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitTask(); }}
                  placeholder="مهمة إدارية مش مرتبطة بفكرة معينة..."
                />
                <button onClick={submitTask} style={S.primaryBtn(colors.warning)}><Plus size={14} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }} className="scrollbar">
                {tasks.length === 0 && <div style={S.emptyBrands}>لسه مفيش مهام مسجلة.</div>}
                {pendingTasks.map((t) => (
                  <div key={t.id} style={S.taskRow}>
                    <button onClick={() => onToggleTask(t.id)} style={S.taskCheckBtn} title="خلصت"><Circle size={14} /></button>
                    <span style={S.taskText}>{t.text}</span>
                    <button onClick={() => onDeleteTask(t.id)} style={S.ticketIconBtnDanger}><Trash2 size={12} /></button>
                  </div>
                ))}
                {doneTasks.map((t) => (
                  <div key={t.id} style={{ ...S.taskRow, opacity: 0.55 }}>
                    <button onClick={() => onToggleTask(t.id)} style={S.taskCheckBtn} title="ارجعها"><CheckCircle2 size={14} /></button>
                    <span style={{ ...S.taskText, textDecoration: "line-through" }}>{t.text}</span>
                    <button onClick={() => onDeleteTask(t.id)} style={S.ticketIconBtnDanger}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Brands — compact */}
          <div>
            <h3 style={S.dashSectionTitle}><Users size={14} /> برانداتك</h3>
            {brands.length === 0 ? (
              <button onClick={onAddBrand} style={S.dashedAddCard}>
                <Plus size={18} />
                <span>ضيف أول براند</span>
              </button>
            ) : (
              <div style={S.brandMiniList}>
                {brands.map((b) => {
                  const c = brandCounts[b.id] || {};
                  const activeCount = (c.idea || 0) + (c.ready || 0) + (c.scheduled || 0);
                  return (
                    <button key={b.id} onClick={() => onOpenBrand(b.id)} style={S.brandMiniCard}>
                      <span style={{ ...S.idCardAvatar, width: 32, height: 32, fontSize: 14, background: b.color + "26", color: b.color }}>{b.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                        <div style={S.brandMiniName}>{b.name}</div>
                        <div style={S.brandMiniMeta}>{activeCount} حاجة شغالة</div>
                      </div>
                      <span style={{ ...S.dot, background: b.color }} />
                    </button>
                  );
                })}
                <button onClick={onAddBrand} style={S.brandMiniAdd}>
                  <Plus size={15} /> براند جديد
                </button>
              </div>
            )}
          </div>

          {/* Week priorities (existing feature, preserved) */}
          <div>
            <h3 style={S.dashSectionTitle}><CalendarIcon size={14} /> أولويات الأسبوع الجاي</h3>
            <div style={S.compactList}>
              {weekPriorities.length === 0 && <div style={S.emptyBrands}>مفيش حاجة مجدولة في السبع أيام الجايين.</div>}
              {weekPriorities.map((it) => {
                const b = brands.find((x) => x.id === it.brandId);
                const dLeft = daysUntil(it.date);
                const near = dLeft !== null && dLeft <= 2;
                return (
                  <div key={it.id} style={S.compactRow}>
                    <span style={{ ...S.dot, background: b?.color || "#666" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.upcomingTitle}>{it.title}</div>
                      <div style={S.upcomingMeta}>{b?.name} · {it.type}</div>
                    </div>
                    <span style={{ ...S.miniBadge, color: near ? colors.danger : colors.warning, background: near ? "rgba(217,112,122,0.16)" : "rgba(231,163,62,0.16)" }}>
                      {near && <AlertTriangle size={10} style={{ verticalAlign: -1 }} />} {fmtDate(it.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div style={S.kpiCard}>
      <span style={{ ...S.kpiIcon, color: color || colors.textDim }}>{icon}</span>
      <div>
        <div style={{ ...S.kpiValue, color: color || colors.text }}>{value}</div>
        <div style={S.kpiLabel}>{label}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={S.statCard} className="statCard">
      <div style={{ ...S.statValue, color: color || colors.text }} className="statValue">{value}</div>
      <div style={S.statLabel} className="statLabel">{label}</div>
    </div>
  );
}

/* ---------- Search across all brands ---------- */

function SearchView({ items, brands, onOpenItem }) {
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (brandFilter && it.brandId !== brandFilter) return false;
      if (typeFilter && it.type !== typeFilter) return false;
      if (statusFilter && it.status !== statusFilter) return false;
      if (!q) return true;
      return (it.title || "").toLowerCase().includes(q) || (it.notes || "").toLowerCase().includes(q);
    }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [items, query, brandFilter, typeFilter, statusFilter]);

  return (
    <div style={S.section}>
      <SectionHeader icon={<Search size={20} />} title="بحث في كل الأفكار" subtitle="دوّر بالاسم أو الملاحظات عبر كل البراندات مرة واحدة" />

      <div style={S.searchBar} className="searchBar">
        <input style={{ ...S.input, flex: 2 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن فكرة..." autoFocus />
        <select style={{ ...S.input, flex: 1 }} value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option value="">كل البراندات</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.emoji} {b.name}</option>)}
        </select>
        <select style={{ ...S.input, flex: 1 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">كل الأنواع</option>
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={{ ...S.input, flex: 1 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">كل الحالات</option>
          {STATUS_DEFS.map((sd) => <option key={sd.key} value={sd.key}>{sd.label}</option>)}
        </select>
      </div>

      <p style={{ ...S.aiHint, margin: "12px 0" }}>{results.length} نتيجة</p>

      <div style={S.upcomingList}>
        {results.length === 0 && <div style={S.emptyBrands}>مفيش نتائج مطابقة.</div>}
        {results.map((it) => {
          const b = brands.find((x) => x.id === it.brandId);
          const sd = STATUS_DEFS.find((s) => s.key === it.status);
          return (
            <button key={it.id} onClick={() => onOpenItem(it)} style={S.searchResultRow}>
              <span style={{ ...S.dot, background: b?.color || "#666" }} />
              <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                <div style={S.upcomingTitle}>{it.title}</div>
                <div style={S.upcomingMeta}>{b?.name} · {it.type}{it.date ? ` · ${fmtDate(it.date)}` : ""}</div>
              </div>
              <span style={{ ...S.miniBadge, color: sd?.color, background: sd?.bg }}>{sd?.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Compare brands ---------- */

function CompareView({ brands, items, onOpenBrand }) {
  const rows = useMemo(() => {
    const t = todayISO();
    return brands.map((b) => {
      const brandItems = items.filter((it) => it.brandId === b.id);
      const total = brandItems.length;
      const done = brandItems.filter((i) => i.status === "done").length;
      const overdue = brandItems.filter((i) => i.date && i.date < t && i.status !== "done").length;
      const received = (b.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
      const remaining = (Number(b.paymentTotal) || 0) - received;
      const followers = (b.pageSnapshots || [])[0]?.followers ?? null;
      const views = brandItems.reduce((s, i) => s + (Number(i.views) || 0), 0);
      return {
        brand: b, total, completionRate: total ? Math.round((done / total) * 100) : 0,
        overdue, remaining, followers, views,
      };
    });
  }, [brands, items]);

  if (brands.length === 0) {
    return (
      <div style={S.section}>
        <SectionHeader icon={<BarChart3 size={20} />} title="مقارنة البراندات" subtitle="لسه مفيش براندات تقارن بينها" />
      </div>
    );
  }

  return (
    <div style={S.section}>
      <SectionHeader icon={<BarChart3 size={20} />} title="مقارنة البراندات" subtitle="كل البراندات جنب بعض عشان تحدد مين محتاج اهتمام أكتر" />

      <div style={{ overflowX: "auto" }} className="scrollbar">
        <table style={S.compareTable} className="compareTable">
          <thead>
            <tr>
              <th style={S.compareTh}>البراند</th>
              <th style={S.compareTh}>نسبة الإنجاز</th>
              <th style={S.compareTh}>متأخرة</th>
              <th style={S.compareTh}>المتابعين</th>
              <th style={S.compareTh}>إجمالي مشاهدات</th>
              <th style={S.compareTh}>المتبقي ماديًا</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.brand.id} style={S.compareTr} onClick={() => onOpenBrand(r.brand.id)}>
                <td style={S.compareTdName}>
                  <span style={{ ...S.dot, background: r.brand.color }} /> {r.brand.emoji} {r.brand.name}
                </td>
                <td style={S.compareTd}>{r.completionRate}%</td>
                <td style={{ ...S.compareTd, color: r.overdue > 0 ? colors.danger : colors.textDim }}>{r.overdue}</td>
                <td style={S.compareTd}>{r.followers != null ? fmtMoney(r.followers) : "—"}</td>
                <td style={S.compareTd}>{fmtMoney(r.views)}</td>
                <td style={{ ...S.compareTd, color: r.remaining < 0 ? colors.danger : colors.warning }}>{fmtMoney(r.remaining)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Account / subscription view ---------- */

function AccountView({ plan, isTrialing, trialEndsAt, currentPeriodEnd, hasSubRow, brandsCount, brandLimit, onRecheck }) {
  const statusLabel = isTrialing
    ? "تجربة مجانية"
    : plan
      ? "مفعّل"
      : hasSubRow
        ? "غير مفعّل"
        : "لسه مفيش اشتراك مسجل";

  const statusColor = isTrialing ? colors.warning : plan ? colors.good : colors.danger;

  let dateLine = null;
  if (isTrialing && trialEndsAt) {
    dateLine = `التجربة المجانية بتنتهي بتاريخ ${new Date(trialEndsAt).toLocaleDateString("ar-EG")}`;
  } else if (plan && currentPeriodEnd) {
    dateLine = `الاشتراك شغال لحد ${new Date(currentPeriodEnd).toLocaleDateString("ar-EG")}`;
  } else if (plan && !currentPeriodEnd) {
    dateLine = "الاشتراك شغال من غير تاريخ انتهاء محدد";
  }

  return (
    <div style={S.section}>
      <SectionHeader icon={<Wallet size={20} />} title="الاشتراك والباقة" subtitle="حالة اشتراكك دلوقتي وخياراتك لو عايز تغيّر أو ترقّي" />

      <div style={S.refCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11.5, color: colors.textDim, fontWeight: 700, marginBottom: 4 }}>الحالة</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: statusColor }}>
              {statusLabel}{plan ? <> — <span style={{ color: planColor(plan) }}>{planLabel(plan) || plan}</span></> : ""}
            </div>
            {dateLine && <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 4 }}>{dateLine}</div>}
          </div>
          {!isTrialing && brandLimit !== Infinity && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{brandsCount}/{brandLimit}</div>
              <div style={{ fontSize: 10.5, color: colors.textFaint }}>البراندات المستخدمة</div>
            </div>
          )}
        </div>
      </div>

      {!hasSubRow && (
        <p style={{ ...S.aiHint, marginTop: 10 }}>
          حسابك لسه مالوش سجل اشتراك في قاعدة البيانات — ده بيحصل عادة لو الحساب اتعمل قبل ما نظام الباقات يتفعّل. تواصل مع الدعم عشان يتظبط.
        </p>
      )}

      <h3 style={{ ...S.h3, marginTop: 24 }}>{plan ? "غيّر أو رقّي باقتك" : "اشترك دلوقتي"}</h3>
      <PlanPicker onRecheck={onRecheck} defaultPlan={(plan || "pro").toString().trim().toLowerCase()} />
    </div>
  );
}

/* ---------- Share link modal ---------- */

function ShareLinkModal({ brand, onPatchBrand, onClose }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const shareUrl = brand.shareToken ? `${window.location.origin}/share/${brand.shareToken}` : "";

  async function createLink() {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase.rpc("create_brand_share", { p_brand_id: brand.id });
      if (err) throw err;
      onPatchBrand(brand.id, { shareToken: data });
    } catch (e) {
      setError("حصلت مشكلة، جرب تاني.");
    } finally {
      setLoading(false);
    }
  }

  async function revokeLink() {
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.rpc("revoke_brand_share", { p_token: brand.shareToken });
      if (err) throw err;
      onPatchBrand(brand.id, { shareToken: null });
    } catch (e) {
      setError("حصلت مشكلة، جرب تاني.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  }

  return (
    <ModalShell onClose={onClose}>
      <div style={S.modalHead}>
        <span style={S.modalTitle}><Share2 size={16} style={{ verticalAlign: -2 }} /> لينك مشاركة مع العميل</span>
        <button onClick={onClose} style={S.iconBtnSm}><X size={16} /></button>
      </div>

      <p style={S.aiHint}>
        اللينك ده صفحة للقراءة بس، تقدر تبعتها لعميل {brand.name} من غير ما يحتاج يسجل دخول. هتوريه المحتوى الجاي والمنشور بس — مفيش أي بيانات مالية أو براندات تانية.
      </p>

      {error && <p style={{ color: colors.danger, fontSize: 12, marginTop: 8 }}>{error}</p>}

      {brand.shareToken ? (
        <>
          <div style={{ marginTop: 14 }}>
            <div style={{ ...S.input, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl}</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={copyLink} style={S.primaryBtn(brand.color)}><Copy size={14} /> {copied ? "اتنسخ" : "انسخ اللينك"}</button>
            <button onClick={revokeLink} disabled={loading} style={S.dangerBtn}><Trash2 size={14} /> ألغِ اللينك</button>
          </div>
        </>
      ) : (
        <button onClick={createLink} disabled={loading} style={{ ...S.primaryBtn(brand.color), width: "100%", justifyContent: "center", marginTop: 14 }}>
          {loading ? "بيتعمل..." : <><Share2 size={14} /> أنشئ لينك مشاركة</>}
        </button>
      )}
    </ModalShell>
  );
}

/* ---------- Brand page ---------- */

function BrandPage({
  brand, items, tab, setTab, onEditBrand, onDeleteBrand,
  onAddItem, onBulkAdd, onEditItem, onDeleteItem, onSetStatus, onPatchItem, onPatchBrand, onUseIdea, calMonth, setCalMonth,
}) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div style={S.section}>
      <div style={S.idBadge}>
        <div style={{ ...S.idBadgeStripe, background: brand.color }} />
        <div style={S.idBadgeInner} className="idBadgeInner">
          <span style={{ ...S.idBadgeAvatar, background: brand.color + "26", color: brand.color }}>{brand.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={S.idBadgeName} className="idBadgeName">{brand.name}</div>
            <div style={S.idBadgeHandle} className="idBadgeHandle">{brand.handle || "بدون بيانات تواصل"}</div>
          </div>
          <button onClick={() => setShareOpen(true)} style={S.iconBtnSm} title="لينك مشاركة للعميل"><Share2 size={14} /></button>
          <button onClick={onEditBrand} style={S.iconBtnSm} title="عدّل البراند"><Pencil size={14} /></button>
          <button onClick={onDeleteBrand} style={S.iconBtnSmDanger} title="امسح البراند"><Trash2 size={14} /></button>
        </div>
      </div>

      {shareOpen && <ShareLinkModal brand={brand} onPatchBrand={onPatchBrand} onClose={() => setShareOpen(false)} />}

      <div style={S.tabRow} className="tabRow">
        <button onClick={() => setTab("board")} style={{ ...S.tabBtn, ...(tab === "board" ? S.tabBtnActive : {}) }}>
          <LayoutGrid size={15} /> لوحة الأفكار
        </button>
        <button onClick={() => setTab("calendar")} style={{ ...S.tabBtn, ...(tab === "calendar" ? S.tabBtnActive : {}) }}>
          <CalendarIcon size={15} /> التقويم
        </button>
        <button onClick={() => setTab("insights")} style={{ ...S.tabBtn, ...(tab === "insights" ? S.tabBtnActive : {}) }}>
          <BarChart3 size={15} /> تحليل البراند
        </button>
        <button onClick={() => setTab("payments")} style={{ ...S.tabBtn, ...(tab === "payments" ? S.tabBtnActive : {}) }}>
          <Wallet size={15} /> المدفوعات
        </button>
        <button onClick={() => setTab("reference")} style={{ ...S.tabBtn, ...(tab === "reference" ? S.tabBtnActive : {}) }}>
          <BookOpen size={15} /> مرجع سريع
        </button>
        <div style={{ flex: 1 }} />
        {tab === "board" && (
          <>
            <button onClick={onBulkAdd} style={S.secondaryBtn}>
              <ListPlus size={15} /> أفكار بالجملة
            </button>
            <button onClick={onAddItem} style={S.primaryBtn(brand.color)}>
              <Plus size={15} /> فكرة جديدة
            </button>
          </>
        )}
      </div>

      {tab === "board" && <Board items={items} onEdit={onEditItem} onDelete={onDeleteItem} onSetStatus={onSetStatus} onPatchItem={onPatchItem} />}
      {tab === "calendar" && (
        <MonthCalendar
          items={items}
          brands={[brand]}
          month={calMonth}
          setMonth={setCalMonth}
          onDayClick={(date) => onEditItem({ brandId: brand.id, date })}
          onItemClick={onEditItem}
        />
      )}
      {tab === "insights" && <BrandInsights brand={brand} items={items} onPatchBrand={onPatchBrand} />}
      {tab === "payments" && <PaymentsTab brand={brand} onPatchBrand={onPatchBrand} />}
      {tab === "reference" && <ReferenceTab brand={brand} onPatchBrand={onPatchBrand} onUseIdea={onUseIdea} />}
    </div>
  );
}

/* ---------- Board — explicit per-card controls (no drag, fully reliable) ---------- */

function Board({ items, onEdit, onDelete, onSetStatus, onPatchItem }) {
  return (
    <div style={S.board} className="scrollbar board">
      {STATUS_DEFS.map((sd, colIdx) => {
        const colItems = items.filter((it) => it.status === sd.key);
        return (
          <div key={sd.key} style={S.column} className="column">
            <div style={S.columnHead}>
              <span style={{ ...S.dot, background: sd.color }} />
              <span style={S.columnTitle}>{sd.label}</span>
              <span style={S.columnCount}>{colItems.length}</span>
            </div>
            <div style={S.columnBody} className="scrollbar columnBody">
              {colItems.length === 0 && <div style={S.columnEmpty}>مفيش أفكار هنا</div>}
              {colItems.map((it) => (
                <TicketCard
                  key={it.id}
                  item={it}
                  statusColor={sd.color}
                  nextStatus={STATUS_DEFS[colIdx + 1]}
                  onEdit={() => onEdit(it)}
                  onDelete={() => onDelete(it)}
                  onMove={(newStatus) => onSetStatus(it.id, newStatus)}
                  onSavePerf={(patch) => onPatchItem(it.id, patch)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TicketCard({ item, statusColor, nextStatus, onEdit, onDelete, onMove, onSavePerf }) {
  const dLeft = item.date ? daysUntil(item.date) : null;
  const isOverdue = dLeft !== null && dLeft < 0 && item.status !== "done";
  const isNear = dLeft !== null && dLeft >= 0 && dLeft <= 2 && item.status !== "done";

  const [perfOpen, setPerfOpen] = useState(false);
  const [linkVal, setLinkVal] = useState(item.link || "");
  const [views, setViews] = useState(item.views ?? "");
  const [likes, setLikes] = useState(item.likes ?? "");
  const [comments, setComments] = useState(item.comments ?? "");
  const [shares, setShares] = useState(item.shares ?? "");
  const [saves, setSaves] = useState(item.saves ?? "");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState("");

  function savePerf() {
    onSavePerf({
      link: linkVal.trim(),
      views: views === "" ? null : Number(views),
      likes: likes === "" ? null : Number(likes),
      comments: comments === "" ? null : Number(comments),
      shares: shares === "" ? null : Number(shares),
      saves: saves === "" ? null : Number(saves),
    });
    setPerfOpen(false);
  }

  async function analyzeLink() {
    if (!linkVal.trim()) return;
    setAnalyzing(true);
    setAnalyzeMsg("");
    try {
      const res = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkVal.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAnalyzeMsg(data.message || "معرفناش نجيب البيانات.");
      } else {
        if (data.views !== null && data.views !== undefined) setViews(data.views);
        if (data.likes !== null && data.likes !== undefined) setLikes(data.likes);
        if (data.comments !== null && data.comments !== undefined) setComments(data.comments);
        if (data.shares !== null && data.shares !== undefined) setShares(data.shares);
        if (data.saves !== null && data.saves !== undefined) setSaves(data.saves);
        setAnalyzeMsg("تم الجلب ✓");
      }
    } catch (e) {
      setAnalyzeMsg("حصلت مشكلة، جرب تاني.");
    } finally {
      setAnalyzing(false);
    }
  }

  const hasPerf = (item.views !== undefined && item.views !== null && item.views !== "") || (item.likes !== undefined && item.likes !== null && item.likes !== "");

  return (
    <div style={{ ...S.ticket, borderTopColor: statusColor }}>
      <div style={S.ticketHead}>
        <span style={S.ticketType}>{item.type}</span>
        <div style={{ display: "flex", gap: 4 }}>
          {item.referenceLink && (
            <a href={normalizeUrl(item.referenceLink)} target="_blank" rel="noopener noreferrer" style={S.ticketIconBtn} title="افتح لينك الريفرنس">
              <Link2 size={12} />
            </a>
          )}
          {item.link && (
            <a href={normalizeUrl(item.link)} target="_blank" rel="noopener noreferrer" style={S.ticketIconBtn} title="افتح لينك المنشور في تبويبة جديدة">
              <ExternalLink size={12} />
            </a>
          )}
          <button onClick={onEdit} style={S.ticketIconBtn} title="عدّل"><Pencil size={12} /></button>
          <button onClick={onDelete} style={S.ticketIconBtnDanger} title="امسح"><Trash2 size={12} /></button>
        </div>
      </div>
      <div style={S.ticketTitle}>{item.title}</div>
      {item.notes && <div style={S.ticketNotes}>{item.notes}</div>}

      {(isOverdue || isNear || hasPerf) && (
        <div style={S.ticketBadgesRow}>
          {isOverdue && <span style={S.badgeDanger}><AlertTriangle size={10} /> متأخرة {Math.abs(dLeft)} يوم</span>}
          {isNear && !isOverdue && <span style={S.badgeWarning}><AlertTriangle size={10} /> قرّب الميعاد</span>}
          {item.views !== undefined && item.views !== null && item.views !== "" && (
            <span style={S.badgeGeneric}><Eye size={10} /> {item.views}</span>
          )}
          {item.likes !== undefined && item.likes !== null && item.likes !== "" && (
            <span style={S.badgeGeneric}><ThumbsUp size={10} /> {item.likes}</span>
          )}
        </div>
      )}

      <div style={S.ticketFooter} className="ticketFooter">
        <span style={S.ticketDate}>
          {item.date ? <><Clock size={11} style={{ verticalAlign: -1 }} /> {fmtDate(item.date)}</> : "بدون معاد"}
          {item.reminderDays !== undefined && item.reminderDays !== null && (
            <span title={`تذكير قبل الميعاد بـ ${item.reminderDays} يوم`}> · <Bell size={10} style={{ verticalAlign: -1 }} /></span>
          )}
        </span>
        <button onClick={() => setPerfOpen((o) => !o)} style={S.perfToggleBtn}>
          <Eye size={11} /> {hasPerf ? "عدّل نتيجة النشر" : "سجّل نتيجة النشر"}
        </button>
      </div>

      {perfOpen && (
        <div style={S.perfPanel}>
          <label style={S.perfLinkLabel}>لينك المنشور</label>
          <input style={{ ...S.input, fontSize: 11.5, padding: "6px 8px" }} value={linkVal} onChange={(e) => setLinkVal(e.target.value)} placeholder="حط لينك المنشور هنا بعد النشر" />

          {linkVal.trim() && (
            <button type="button" onClick={analyzeLink} disabled={analyzing} style={{ ...S.moveTextBtn, marginTop: 6, borderStyle: "solid" }}>
              {analyzing ? "بيجيب البيانات..." : "🔍 اجلب الأرقام تلقائي"}
            </button>
          )}
          {analyzeMsg && <p style={{ ...S.aiHint, fontSize: 10, marginTop: 4 }}>{analyzeMsg}</p>}

          <p style={S.aiHint}>أو حط الأرقام بنفسك تحت.</p>
          <div style={S.perfInputsRow} className="perfInputsRow">
            <input type="number" min="0" style={S.perfInput} value={views} onChange={(e) => setViews(e.target.value)} placeholder="مشاهدات" />
            <input type="number" min="0" style={S.perfInput} value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="لايكات" />
            <input type="number" min="0" style={S.perfInput} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="كومنتات" />
          </div>
          <div style={{ ...S.perfInputsRow, marginTop: 5 }} className="perfInputsRow">
            <input type="number" min="0" style={S.perfInput} value={shares} onChange={(e) => setShares(e.target.value)} placeholder="مشاركات" />
            <input type="number" min="0" style={S.perfInput} value={saves} onChange={(e) => setSaves(e.target.value)} placeholder="حفظ" />
          </div>
          <button onClick={savePerf} style={{ ...S.moveTextBtn, marginTop: 6 }}><Save size={12} style={{ verticalAlign: -1 }} /> احفظ نتيجة النشر</button>
        </div>
      )}

      <label style={S.ticketMoveLabel}>
        نقل هذه الفكرة لمرحلة:
        <select
          value={item.status}
          onChange={(e) => onMove(e.target.value)}
          style={S.ticketStatusSelect}
        >
          {STATUS_DEFS.map((sd) => <option key={sd.key} value={sd.key}>{sd.label}</option>)}
        </select>
      </label>

      {nextStatus && (
        <button onClick={() => onMove(nextStatus.key)} style={S.moveTextBtn}>
          قدّم هذه الفكرة لمرحلة "{nextStatus.label}"
        </button>
      )}
    </div>
  );
}

/* ---------- Brand insights ---------- */

function BrandInsights({ brand, items, onPatchBrand }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sections, setSections] = useState({
    overview: true, status: true, byType: true, performance: true, top5: true, financial: true, pageTracking: true,
  });
  const reportRef = useRef(null);

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const completionRate = total ? Math.round((done / total) * 100) : 0;
  const overdue = items.filter((i) => i.date && i.date < todayISO() && i.status !== "done").length;
  const received = (brand.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const remaining = (Number(brand.paymentTotal) || 0) - received;

  const mixTargets = brand.contentMixTargets || {};
  function saveMixTarget(type, value) {
    const num = value === "" ? undefined : Number(value);
    const next = { ...mixTargets };
    if (num === undefined) delete next[type];
    else next[type] = num;
    onPatchBrand(brand.id, { contentMixTargets: next });
  }
  const mixTargetSum = Object.values(mixTargets).reduce((s, v) => s + Number(v || 0), 0);

  const perfTotals = useMemo(() => {
    const monthPrefix = todayISO().slice(0, 7);
    const acc = { views: 0, likes: 0, comments: 0, monthViews: 0, monthLikes: 0, monthComments: 0 };
    for (const it of items) {
      const v = Number(it.views) || 0;
      const l = Number(it.likes) || 0;
      const c = Number(it.comments) || 0;
      acc.views += v;
      acc.likes += l;
      acc.comments += c;
      if (it.date && it.date.slice(0, 7) === monthPrefix) {
        acc.monthViews += v;
        acc.monthLikes += l;
        acc.monthComments += c;
      }
    }
    return acc;
  }, [items]);

  const byType = useMemo(() => {
    const map = {};
    for (const it of items) map[it.type] = (map[it.type] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [items]);
  const maxTypeCount = Math.max(1, ...byType.map(([, c]) => c));

  const top5 = useMemo(
    () => items.filter((i) => i.views !== undefined && i.views !== null && i.views !== "")
      .sort((a, b) => Number(b.views) - Number(a.views)).slice(0, 5),
    [items]
  );

  const REPORT_SECTIONS = [
    { key: "overview", label: "نظرة عامة" },
    { key: "status", label: "حالة الأفكار" },
    { key: "byType", label: "حسب نوع المحتوى" },
    { key: "performance", label: "الأداء (مشاهدات ولايكات)" },
    { key: "top5", label: "أفضل 5 محتوى" },
    { key: "financial", label: "الوضع المالي (الإجمالي والمستلم فقط)" },
    { key: "pageTracking", label: "تتبع نمو الصفحة" },
  ];

  function toggleSection(key) {
    setSections((s) => ({ ...s, [key]: !s[key] }));
  }

  const reportData = useMemo(() => {
    const receivedTotal = (brand.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const remainingTotal = (Number(brand.paymentTotal) || 0) - receivedTotal;
    const lastSnapshot = (brand.pageSnapshots || [])[0];
    const firstSnapshot = (brand.pageSnapshots || [])[(brand.pageSnapshots || []).length - 1];
    const top5Items = items
      .filter((i) => i.views !== undefined && i.views !== null && i.views !== "")
      .sort((a, b) => Number(b.views) - Number(a.views))
      .slice(0, 5);
    return { receivedTotal, remainingTotal, lastSnapshot, firstSnapshot, top5Items };
  }, [brand, items]);

  function buildReportText() {
    const { receivedTotal, remainingTotal, lastSnapshot, firstSnapshot, top5Items } = reportData;
    const lines = [];
    lines.push(`تقرير براند: ${brand.name}`);
    lines.push(`بتاريخ: ${fmtDate(todayISO())}`);

    if (sections.overview) {
      lines.push("", "== نظرة عامة ==");
      if (brand.agreementNotes) lines.push(`الاتفاق مع البراند: ${brand.agreementNotes}`);
      lines.push(`إجمالي الأفكار: ${total} | نسبة الإنجاز: ${completionRate}% | متأخرة عن معادها: ${overdue}`);
    }
    if (sections.status) {
      lines.push("", "== حالة الأفكار ==");
      STATUS_DEFS.forEach((sd) => lines.push(`${sd.label}: ${items.filter((i) => i.status === sd.key).length}`));
    }
    if (sections.byType) {
      lines.push("", "== حسب نوع المحتوى ==");
      byType.forEach(([t, c]) => {
        const target = mixTargets[t];
        lines.push(`${t}: ${c}${target !== undefined ? ` (مستهدف ${target}%)` : ""}`);
      });
    }
    if (sections.performance) {
      lines.push("", "== الأداء ==");
      lines.push(`إجمالي المشاهدات: ${perfTotals.views} | إجمالي اللايكات: ${perfTotals.likes} | إجمالي الكومنتات: ${perfTotals.comments}`);
      lines.push(`مشاهدات الشهر ده: ${perfTotals.monthViews} | لايكات الشهر ده: ${perfTotals.monthLikes}`);
    }
    if (sections.top5 && top5Items.length) {
      lines.push("", "أفضل 5 محتوى:");
      top5Items.forEach((i, idx) => lines.push(`${idx + 1}. ${i.title} — ${i.views} مشاهدة${i.successNote ? ` (${i.successNote})` : ""}`));
    }
    if (sections.financial) {
      lines.push("", "== الوضع المالي ==");
      if (brand.paymentTotal) {
        lines.push(`الإجمالي المتفق عليه: ${fmtMoney(brand.paymentTotal)} | المستلم: ${fmtMoney(receivedTotal)} | المتبقي: ${fmtMoney(remainingTotal)}`);
      } else {
        lines.push("مفيش إجمالي متفق عليه مسجل.");
      }
    }
    if (sections.pageTracking) {
      lines.push("", "== تتبع الصفحة ==");
      if (lastSnapshot) {
        lines.push(`آخر قياس: ${lastSnapshot.followers ?? "؟"} متابع، ${lastSnapshot.posts ?? "؟"} بوست بتاريخ ${lastSnapshot.date}`);
        if (firstSnapshot && firstSnapshot.id !== lastSnapshot.id) {
          lines.push(`أول قياس مسجل: ${firstSnapshot.followers ?? "؟"} متابع بتاريخ ${firstSnapshot.date}`);
        }
      } else {
        lines.push("مفيش قياسات مسجلة لصفحة البراند لسه.");
      }
    }
    return lines.join("\n");
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(buildReportText());
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 1500);
    } catch (e) {}
  }

  function downloadReportTxt() {
    const blob = new Blob([buildReportText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير-${brand.name}-${todayISO()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function downloadReportPdf() {
    if (!reportRef.current) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`تقرير-${brand.name}-${todayISO()}.pdf`);
    } catch (e) {
      console.error("تعذر إنشاء الـ PDF", e);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div>
      <div style={S.statRow} className="statRow">
        <StatCard label="إجمالي الأفكار" value={total} />
        <StatCard label="نسبة الإنجاز" value={`${completionRate}%`} color={colors.good} />
        <StatCard label="مجدولة دلوقتي" value={items.filter((i) => i.status === "scheduled").length} color={colors.warning} />
        <StatCard label="متأخرة عن معادها" value={overdue} color={colors.danger} />
        <StatCard label="المتبقي من البراند" value={fmtMoney(remaining)} color={remaining < 0 ? colors.danger : remaining === 0 ? colors.good : colors.warning} />
      </div>

      <h3 style={S.h3}><Eye size={14} style={{ verticalAlign: -2 }} /> أداء المحتوى مع البراند ده</h3>
      <div style={S.perfTotalsGrid} className="perfTotalsGrid">
        <div style={S.perfTotalsCol}>
          <span style={S.perfTotalsLabel}>الشهر ده</span>
          <div style={S.statRow} className="statRow">
            <StatCard label="مشاهدات" value={fmtMoney(perfTotals.monthViews)} color={colors.info} />
            <StatCard label="لايكات" value={fmtMoney(perfTotals.monthLikes)} color={colors.good} />
            <StatCard label="كومنتات" value={fmtMoney(perfTotals.monthComments)} color={colors.warning} />
          </div>
        </div>
        <div style={S.perfTotalsCol}>
          <span style={S.perfTotalsLabel}>إجمالي كل الوقت</span>
          <div style={S.statRow} className="statRow">
            <StatCard label="مشاهدات" value={fmtMoney(perfTotals.views)} color={colors.info} />
            <StatCard label="لايكات" value={fmtMoney(perfTotals.likes)} color={colors.good} />
            <StatCard label="كومنتات" value={fmtMoney(perfTotals.comments)} color={colors.warning} />
          </div>
        </div>
      </div>
      {perfTotals.views === 0 && perfTotals.likes === 0 && perfTotals.comments === 0 && (
        <p style={S.aiHint}>الأرقام دي بتتجمع من "نتيجة النشر" اللي بتسجلها في كل فكرة — سجّل المشاهدات واللايكات بعد النشر وهتلاقي الإجمالي هنا.</p>
      )}

      <div style={S.dashGrid} className="dashGrid">
        <div>
          <h3 style={S.h3}><Target size={13} style={{ verticalAlign: -2 }} /> ميزان المحتوى (الفعلي مقابل المستهدف)</h3>
          <div style={S.barList}>
            {byType.length === 0 && <div style={S.emptyBrands}>لسه مفيش أفكار مسجلة.</div>}
            {byType.map(([t, c]) => {
              const actualPct = total ? Math.round((c / total) * 100) : 0;
              const target = mixTargets[t];
              return (
                <div key={t} style={S.mixRow}>
                  <span style={S.barLabel}>{t}</span>
                  <div style={{ ...S.barTrack, position: "relative" }}>
                    <div style={{ ...S.barFill, width: `${actualPct}%`, background: brand.color }} />
                    {target !== undefined && <div style={{ ...S.mixTargetMarker, left: `${Math.min(target, 100)}%` }} title={`مستهدف ${target}%`} />}
                  </div>
                  <span style={S.barValue}>{actualPct}%</span>
                  <input
                    type="number" min="0" max="100" style={S.mixTargetInput}
                    defaultValue={target ?? ""}
                    onBlur={(e) => saveMixTarget(t, e.target.value)}
                    placeholder="هدف%"
                  />
                </div>
              );
            })}
          </div>
          {mixTargetSum > 0 && mixTargetSum !== 100 && (
            <p style={S.aiHint}>مجموع النسب المستهدفة دلوقتي {mixTargetSum}% — يفضل يكون المجموع 100% عشان الميزان يبقى مظبوط.</p>
          )}

          <h3 style={{ ...S.h3, marginTop: 22 }}><Award size={13} style={{ verticalAlign: -2 }} /> أفضل 5 محتوى (مشاهدات/تفاعل)</h3>
          <div style={S.leaderboard}>
            {top5.length === 0 && <div style={S.emptyBrands}>سجّل رقم المشاهدات/التفاعل في أي فكرة عشان يظهر ترتيبها هنا.</div>}
            {top5.map((it, i) => (
              <div key={it.id} style={S.leaderRow}>
                <span style={S.leaderRank}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.upcomingTitle}>{it.title}</div>
                  {it.successNote && <div style={S.leaderNote}>"{it.successNote}"</div>}
                </div>
                <span style={S.miniBadge}><Eye size={11} style={{ verticalAlign: -1 }} /> {it.views}{it.likes !== undefined && it.likes !== null && it.likes !== "" ? ` · ${it.likes}` : ""}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={S.h3}><FileText size={14} style={{ verticalAlign: -2 }} /> تقرير البراند</h3>
          <div style={S.aiAnalysisCard}>
            <p style={S.aiHint}>يجمّعلك تقرير من البيانات المسجلة عن البراند ده — تختار إيه يتحط فيه، وتقدر تنسخه أو تنزّله PDF جاهز تبعته للعميل.</p>
            <button onClick={() => setReportOpen(true)} style={S.primaryBtn(brand.color)} disabled={total === 0}>
              <FileText size={14} /> استخرج تقرير كامل عن البراند
            </button>
            {total === 0 && <p style={S.aiHint}>ضيف كام فكرة للبراند الأول عشان يبقى فيه محتوى للتقرير.</p>}
          </div>
        </div>
      </div>

      {reportOpen && (
        <ModalShell onClose={() => setReportOpen(false)} wide>
          <div style={S.modalHead}>
            <span style={S.modalTitle}><FileText size={16} style={{ verticalAlign: -2 }} /> تقرير {brand.name}</span>
            <button onClick={() => setReportOpen(false)} style={S.iconBtnSm}><X size={16} /></button>
          </div>

          <p style={S.aiHint}>اختار إيه اللي يتحط في التقرير (المصاريف والربح الصافي بتاعك مش بيتحطوش خالص حتى لو اخترت "الوضع المالي" — دي بيانات داخلية بس):</p>
          <div style={S.sectionCheckGrid}>
            {REPORT_SECTIONS.map((s) => (
              <label key={s.key} style={S.sectionCheckLabel}>
                <input type="checkbox" checked={sections[s.key]} onChange={() => toggleSection(s.key)} />
                {s.label}
              </label>
            ))}
          </div>

          <div ref={reportRef} style={S.reportPreview}>
            <h2 style={S.reportPreviewTitle}>تقرير {brand.name}</h2>
            <p style={S.reportPreviewDate}>بتاريخ {fmtDate(todayISO())}</p>

            {sections.overview && (
              <div style={S.reportSection}>
                <h4 style={S.reportSectionTitle}>نظرة عامة</h4>
                {brand.agreementNotes && <p style={S.reportP}>الاتفاق مع البراند: {brand.agreementNotes}</p>}
                <p style={S.reportP}>إجمالي الأفكار: {total} | نسبة الإنجاز: {completionRate}% | متأخرة عن معادها: {overdue}</p>
              </div>
            )}
            {sections.status && (
              <div style={S.reportSection}>
                <h4 style={S.reportSectionTitle}>حالة الأفكار</h4>
                {STATUS_DEFS.map((sd) => (
                  <p key={sd.key} style={S.reportP}>{sd.label}: {items.filter((i) => i.status === sd.key).length}</p>
                ))}
              </div>
            )}
            {sections.byType && (
              <div style={S.reportSection}>
                <h4 style={S.reportSectionTitle}>حسب نوع المحتوى</h4>
                {byType.map(([t, c]) => (
                  <p key={t} style={S.reportP}>{t}: {c}{mixTargets[t] !== undefined ? ` (مستهدف ${mixTargets[t]}%)` : ""}</p>
                ))}
              </div>
            )}
            {sections.performance && (
              <div style={S.reportSection}>
                <h4 style={S.reportSectionTitle}>الأداء</h4>
                <p style={S.reportP}>إجمالي المشاهدات: {perfTotals.views} | إجمالي اللايكات: {perfTotals.likes} | إجمالي الكومنتات: {perfTotals.comments}</p>
                <p style={S.reportP}>مشاهدات الشهر ده: {perfTotals.monthViews} | لايكات الشهر ده: {perfTotals.monthLikes}</p>
              </div>
            )}
            {sections.top5 && reportData.top5Items.length > 0 && (
              <div style={S.reportSection}>
                <h4 style={S.reportSectionTitle}>أفضل 5 محتوى</h4>
                {reportData.top5Items.map((i, idx) => (
                  <p key={i.id} style={S.reportP}>{idx + 1}. {i.title} — {i.views} مشاهدة{i.successNote ? ` (${i.successNote})` : ""}</p>
                ))}
              </div>
            )}
            {sections.financial && (
              <div style={S.reportSection}>
                <h4 style={S.reportSectionTitle}>الوضع المالي</h4>
                {brand.paymentTotal ? (
                  <p style={S.reportP}>الإجمالي المتفق عليه: {fmtMoney(brand.paymentTotal)} | المستلم: {fmtMoney(reportData.receivedTotal)} | المتبقي: {fmtMoney(reportData.remainingTotal)}</p>
                ) : (
                  <p style={S.reportP}>مفيش إجمالي متفق عليه مسجل.</p>
                )}
              </div>
            )}
            {sections.pageTracking && (
              <div style={S.reportSection}>
                <h4 style={S.reportSectionTitle}>تتبع نمو الصفحة</h4>
                {reportData.lastSnapshot ? (
                  <>
                    <p style={S.reportP}>آخر قياس: {reportData.lastSnapshot.followers ?? "؟"} متابع، {reportData.lastSnapshot.posts ?? "؟"} بوست بتاريخ {reportData.lastSnapshot.date}</p>
                    {reportData.firstSnapshot && reportData.firstSnapshot.id !== reportData.lastSnapshot.id && (
                      <p style={S.reportP}>أول قياس مسجل: {reportData.firstSnapshot.followers ?? "؟"} متابع بتاريخ {reportData.firstSnapshot.date}</p>
                    )}
                  </>
                ) : (
                  <p style={S.reportP}>مفيش قياسات مسجلة لصفحة البراند لسه.</p>
                )}
              </div>
            )}
          </div>

          <div style={{ ...S.modalFooter, justifyContent: "flex-start", marginTop: 12, flexWrap: "wrap" }} className="modalFooter">
            <button onClick={copyReport} style={S.secondaryBtn}><Copy size={14} /> {reportCopied ? "اتنسخ" : "انسخ التقرير"}</button>
            <button onClick={downloadReportTxt} style={S.secondaryBtn}><Download size={14} /> نزّل كملف نصي</button>
            <button onClick={downloadReportPdf} disabled={pdfLoading} style={S.primaryBtn(brand.color)}>
              <FileText size={14} /> {pdfLoading ? "بيتجهّز..." : "نزّل PDF"}
            </button>
          </div>
        </ModalShell>
      )}

      <div style={{ marginTop: 28 }}>
        <PageTrackingCard brand={brand} onPatchBrand={onPatchBrand} />
      </div>
    </div>
  );
}

function PageTrackingCard({ brand, onPatchBrand }) {
  const [pageLink, setPageLink] = useState(brand.pageLink || "");
  const [followersInput, setFollowersInput] = useState("");
  const [postsInput, setPostsInput] = useState("");

  useEffect(() => { setPageLink(brand.pageLink || ""); }, [brand.id]);

  const snapshots = brand.pageSnapshots || [];

  function savePageLink() { onPatchBrand(brand.id, { pageLink }); }

  function saveSnapshot() {
    const entry = {
      id: uid(),
      date: todayISO(),
      followers: followersInput === "" ? null : Number(followersInput),
      posts: postsInput === "" ? null : Number(postsInput),
    };
    onPatchBrand(brand.id, { pageSnapshots: [entry, ...snapshots] });
    setFollowersInput("");
    setPostsInput("");
  }

  function removeSnapshot(id) {
    onPatchBrand(brand.id, { pageSnapshots: snapshots.filter((s) => s.id !== id) });
  }

  const growthSummary = useMemo(() => {
    if (snapshots.length < 2) return null;
    const latest = snapshots[0];
    const oldest = snapshots[snapshots.length - 1];
    if (latest.followers == null || oldest.followers == null) return null;
    const diff = latest.followers - oldest.followers;
    const days = Math.max(1, Math.round((new Date(latest.date) - new Date(oldest.date)) / 86400000));
    return { diff, days, from: oldest, to: latest };
  }, [snapshots]);

  return (
    <div>
      <h3 style={S.h3}><Users size={14} style={{ verticalAlign: -2 }} /> تتبع صفحة البراند</h3>
      <div style={S.refCard}>
        <input style={S.input} value={pageLink} onChange={(e) => setPageLink(e.target.value)} onBlur={savePageLink} placeholder="لينك صفحة البراند (انستجرام، تيك توك...)" />
        <p style={S.aiHint}>سجّل أول قياس أول ما تمسك البراند، وكرر التسجيل كل فترة عشان تبني سجل نمو حقيقي.</p>

        <div style={{ ...S.rowTwo, marginTop: 10 }} className="rowTwo">
          <div style={S.formGroup}>
            <label style={S.label}>عدد المتابعين</label>
            <input type="number" min="0" style={S.input} value={followersInput} onChange={(e) => setFollowersInput(e.target.value)} placeholder="اكتب الرقم اللي شفته" />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>عدد البوستات</label>
            <input type="number" min="0" style={S.input} value={postsInput} onChange={(e) => setPostsInput(e.target.value)} placeholder="اكتب الرقم اللي شفته" />
          </div>
        </div>
        <button onClick={saveSnapshot} style={S.primaryBtn(brand.color)}><Save size={14} /> سجّل القياس ده</button>
      </div>

      {snapshots.length > 0 && (
        <>
          <h3 style={{ ...S.h3, marginTop: 18 }}>سجل القياسات</h3>
          {growthSummary && (
            <div style={{ ...S.refCard, marginBottom: 10 }}>
              <p style={{ ...S.aiAnalysisText, margin: 0 }}>
                <TrendingUp size={13} style={{ verticalAlign: -2 }} /> من {fmtDate(growthSummary.from.date)} لحد {fmtDate(growthSummary.to.date)} ({growthSummary.days} يوم):
                {" "}{growthSummary.diff >= 0 ? "زوّدت" : "قلّت"} {fmtMoney(Math.abs(growthSummary.diff))} متابع.
              </p>
            </div>
          )}
          <div style={{ ...S.upcomingList, maxHeight: 280, overflowY: "auto" }} className="scrollbar">
            {snapshots.map((s, i) => {
              const prev = snapshots[i + 1];
              const fDiff = prev && s.followers != null && prev.followers != null ? s.followers - prev.followers : null;
              return (
                <div key={s.id} style={S.upcomingRow}>
                  <span style={{ ...S.dot, background: brand.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.upcomingTitle}>
                      {s.followers != null ? `${fmtMoney(s.followers)} متابع` : "متابعين غير مسجلة"}
                      {s.posts != null && ` · ${fmtMoney(s.posts)} بوست`}
                      {fDiff != null && (fDiff >= 0 ? ` · +${fmtMoney(fDiff)}` : ` · ${fmtMoney(fDiff)}`)}
                    </div>
                    <div style={S.upcomingMeta}>{fmtDate(s.date)}</div>
                  </div>
                  <button onClick={() => removeSnapshot(s.id)} style={S.ticketIconBtnDanger}><Trash2 size={12} /></button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Payments tab (brand-level running ledger) ---------- */

function PaymentsTab({ brand, onPatchBrand }) {
  const [totalInput, setTotalInput] = useState(brand.paymentTotal ?? 0);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  const [expAmount, setExpAmount] = useState("");
  const [expNote, setExpNote] = useState("");
  const [expDate, setExpDate] = useState(todayISO());

  useEffect(() => { setTotalInput(brand.paymentTotal ?? 0); }, [brand.id]);

  const payments = brand.payments || [];
  const expenses = brand.expenses || [];
  const received = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const spent = expenses.reduce((s, p) => s + Number(p.amount || 0), 0);
  const netProfit = received - spent;
  const total = Number(brand.paymentTotal) || 0;
  const remaining = total - received;

  function saveTotal() {
    onPatchBrand(brand.id, { paymentTotal: Number(totalInput) || 0 });
  }

  function addPayment() {
    const a = Number(amount);
    if (!a || a <= 0) return;
    const entry = { id: uid(), amount: a, note: note.trim(), date };
    onPatchBrand(brand.id, { payments: [entry, ...payments] });
    setAmount("");
    setNote("");
    setDate(todayISO());
  }

  function removePayment(id) {
    onPatchBrand(brand.id, { payments: payments.filter((p) => p.id !== id) });
  }

  function addExpense() {
    const a = Number(expAmount);
    if (!a || a <= 0) return;
    const entry = { id: uid(), amount: a, note: expNote.trim(), date: expDate };
    onPatchBrand(brand.id, { expenses: [entry, ...expenses] });
    setExpAmount("");
    setExpNote("");
    setExpDate(todayISO());
  }

  function removeExpense(id) {
    onPatchBrand(brand.id, { expenses: expenses.filter((p) => p.id !== id) });
  }

  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");

  function startEdit(p) {
    setEditingId(p.id);
    setEditAmount(p.amount);
    setEditDate(p.date);
    setEditNote(p.note || "");
  }
  function cancelEdit() { setEditingId(null); }
  function saveEditedPayment() {
    const a = Number(editAmount);
    onPatchBrand(brand.id, {
      payments: payments.map((p) => (p.id === editingId ? { ...p, amount: a || 0, date: editDate, note: editNote.trim() } : p)),
    });
    setEditingId(null);
  }

  const [editingExpId, setEditingExpId] = useState(null);
  const [editExpAmount, setEditExpAmount] = useState("");
  const [editExpDate, setEditExpDate] = useState("");
  const [editExpNote, setEditExpNote] = useState("");

  function startEditExpense(p) {
    setEditingExpId(p.id);
    setEditExpAmount(p.amount);
    setEditExpDate(p.date);
    setEditExpNote(p.note || "");
  }
  function cancelEditExpense() { setEditingExpId(null); }
  function saveEditedExpense() {
    const a = Number(editExpAmount);
    onPatchBrand(brand.id, {
      expenses: expenses.map((p) => (p.id === editingExpId ? { ...p, amount: a || 0, date: editExpDate, note: editExpNote.trim() } : p)),
    });
    setEditingExpId(null);
  }

  return (
    <div>
      <div style={S.statRow} className="statRow">
        <StatCard label="الإجمالي المتفق عليه" value={fmtMoney(total)} />
        <StatCard label="المستلم لحد دلوقتي" value={fmtMoney(received)} color={colors.good} />
        <StatCard label="المتبقي" value={fmtMoney(remaining)} color={remaining < 0 ? colors.danger : remaining === 0 ? colors.good : colors.warning} />
        <StatCard label="إجمالي المصاريف" value={fmtMoney(spent)} color={colors.danger} />
        <StatCard label="الصافي (ربحك الحقيقي)" value={fmtMoney(netProfit)} color={netProfit < 0 ? colors.danger : colors.good} />
      </div>

      <div style={S.dashGrid} className="dashGrid">
        <div>
          <h3 style={S.h3}><Banknote size={14} style={{ verticalAlign: -2 }} /> الإجمالي المتفق عليه مع البراند</h3>
          <div style={S.refCard}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="number" min="0" style={S.input} value={totalInput} onChange={(e) => setTotalInput(e.target.value)} onBlur={saveTotal} placeholder="مثلاً 10000" />
              <button onClick={saveTotal} style={S.primaryBtn(brand.color)}><Save size={14} /></button>
            </div>
            <p style={S.aiHint}>ده الرقم الكلي المتفق عليه مع البراند. كل دفعة تسجلها تحت بتتخصم منه تلقائي.</p>
          </div>
        </div>

        <div>
          <h3 style={S.h3}>سجّل دفعة جديدة</h3>
          <div style={S.refCard}>
            <div style={S.rowTwo} className="rowTwo">
              <div style={S.formGroup}>
                <label style={S.label}>المبلغ</label>
                <input type="number" min="0" style={S.input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثلاً 2000" />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>التاريخ</label>
                <input type="date" style={S.input} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>ملاحظة (اختياري)</label>
              <input style={S.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: دفعة أولى" />
            </div>
            <button onClick={addPayment} style={S.primaryBtn(brand.color)}><Plus size={14} /> سجّل الدفعة</button>
          </div>
        </div>
      </div>

      <h3 style={{ ...S.h3, marginTop: 22 }}>سجل الدفعات</h3>
      <div style={{ ...S.upcomingList, maxHeight: 320, overflowY: "auto" }} className="scrollbar">
        {payments.length === 0 && <div style={S.emptyBrands}>لسه مفيش دفعات مسجلة.</div>}
        {payments.map((p) =>
          editingId === p.id ? (
            <div key={p.id} style={S.refCard}>
              <div style={S.rowTwo} className="rowTwo">
                <div style={S.formGroup}>
                  <label style={S.label}>المبلغ</label>
                  <input type="number" min="0" style={S.input} value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>التاريخ</label>
                  <input type="date" style={S.input} value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>ملاحظة (اختياري)</label>
                <input style={S.input} value={editNote} onChange={(e) => setEditNote(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={cancelEdit} style={S.secondaryBtn}>إلغاء</button>
                <button onClick={saveEditedPayment} style={S.primaryBtn(brand.color)}><Save size={13} /> احفظ</button>
              </div>
            </div>
          ) : (
            <div key={p.id} style={S.upcomingRow}>
              <span style={{ ...S.dot, background: colors.good }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.upcomingTitle}>{fmtMoney(p.amount)} {p.note && `· ${p.note}`}</div>
                <div style={S.upcomingMeta}>{fmtDate(p.date)}</div>
              </div>
              <button onClick={() => startEdit(p)} style={S.ticketIconBtn}><Pencil size={12} /></button>
              <button onClick={() => removePayment(p.id)} style={S.ticketIconBtnDanger}><Trash2 size={12} /></button>
            </div>
          )
        )}
      </div>

      <h3 style={{ ...S.h3, marginTop: 28 }}><Minus size={14} style={{ verticalAlign: -2 }} /> المصاريف (إعلانات، مصممين، أدوات...)</h3>
      <div style={S.refCard}>
        <div style={S.rowTwo} className="rowTwo">
          <div style={S.formGroup}>
            <label style={S.label}>المبلغ</label>
            <input type="number" min="0" style={S.input} value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="مثلاً 500" />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>التاريخ</label>
            <input type="date" style={S.input} value={expDate} onChange={(e) => setExpDate(e.target.value)} />
          </div>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>على إيه؟ (اختياري)</label>
          <input style={S.input} value={expNote} onChange={(e) => setExpNote(e.target.value)} placeholder="مثلاً: بوست ممول، مصمم فريلانس..." />
        </div>
        <button onClick={addExpense} style={S.dangerBtn}><Minus size={14} /> سجّل مصروف</button>
      </div>

      <div style={{ ...S.upcomingList, maxHeight: 320, overflowY: "auto", marginTop: 10 }} className="scrollbar">
        {expenses.length === 0 && <div style={S.emptyBrands}>لسه مفيش مصاريف مسجلة.</div>}
        {expenses.map((p) =>
          editingExpId === p.id ? (
            <div key={p.id} style={S.refCard}>
              <div style={S.rowTwo} className="rowTwo">
                <div style={S.formGroup}>
                  <label style={S.label}>المبلغ</label>
                  <input type="number" min="0" style={S.input} value={editExpAmount} onChange={(e) => setEditExpAmount(e.target.value)} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>التاريخ</label>
                  <input type="date" style={S.input} value={editExpDate} onChange={(e) => setEditExpDate(e.target.value)} />
                </div>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>على إيه؟ (اختياري)</label>
                <input style={S.input} value={editExpNote} onChange={(e) => setEditExpNote(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={cancelEditExpense} style={S.secondaryBtn}>إلغاء</button>
                <button onClick={saveEditedExpense} style={S.primaryBtn(brand.color)}><Save size={13} /> احفظ</button>
              </div>
            </div>
          ) : (
            <div key={p.id} style={S.upcomingRow}>
              <span style={{ ...S.dot, background: colors.danger }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.upcomingTitle}>{fmtMoney(p.amount)} {p.note && `· ${p.note}`}</div>
                <div style={S.upcomingMeta}>{fmtDate(p.date)}</div>
              </div>
              <button onClick={() => startEditExpense(p)} style={S.ticketIconBtn}><Pencil size={12} /></button>
              <button onClick={() => removeExpense(p.id)} style={S.ticketIconBtnDanger}><Trash2 size={12} /></button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ---------- Reference tab ---------- */

function ReferenceTab({ brand, onPatchBrand, onUseIdea }) {
  const [hashtags, setHashtags] = useState(brand.hashtags || "");
  const [agreementNotes, setAgreementNotes] = useState(brand.agreementNotes || "");
  const [copied, setCopied] = useState(false);
  const [newEvergreen, setNewEvergreen] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const templates = brand.captionTemplates || {};
  const evergreen = brand.evergreenIdeas || [];
  const sources = brand.referenceSources || [];

  useEffect(() => {
    setHashtags(brand.hashtags || "");
    setAgreementNotes(brand.agreementNotes || "");
  }, [brand.id]);

  function saveHashtags() { onPatchBrand(brand.id, { hashtags }); }
  function saveAgreementNotes() { onPatchBrand(brand.id, { agreementNotes }); }
  function saveTemplate(type, value) {
    onPatchBrand(brand.id, { captionTemplates: { ...templates, [type]: value } });
  }
  function addEvergreen() {
    const t = newEvergreen.trim();
    if (!t) return;
    onPatchBrand(brand.id, { evergreenIdeas: [...evergreen, { id: uid(), text: t }] });
    setNewEvergreen("");
  }
  function removeEvergreen(id) {
    onPatchBrand(brand.id, { evergreenIdeas: evergreen.filter((e) => e.id !== id) });
  }
  function addSource() {
    const url = sourceUrl.trim();
    if (!url) return;
    onPatchBrand(brand.id, { referenceSources: [{ id: uid(), title: sourceTitle.trim(), url }, ...sources] });
    setSourceTitle("");
    setSourceUrl("");
  }
  function removeSource(id) {
    onPatchBrand(brand.id, { referenceSources: sources.filter((s) => s.id !== id) });
  }
  async function copyHashtags() {
    try { await navigator.clipboard.writeText(hashtags); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {}
  }

  return (
    <div>
      <h3 style={S.h3}><MessageCircle size={14} style={{ verticalAlign: -2 }} /> الاتفاق مع البراند</h3>
      <div style={{ ...S.refCard, marginBottom: 22 }}>
        <textarea
          style={{ ...S.input, minHeight: 80, resize: "vertical" }}
          value={agreementNotes}
          onChange={(e) => setAgreementNotes(e.target.value)}
          onBlur={saveAgreementNotes}
          placeholder="مثلاً: متفقين على 8 بوستات و4 ريلز في الشهر، البراند محتاج مني أفكار وتصوير، وهو مسؤول عن الموافقة النهائية والمنتج..."
        />
      </div>

      <div style={S.dashGrid} className="dashGrid">
        <div>
          <h3 style={S.h3}><Hash size={14} style={{ verticalAlign: -2 }} /> هاشتاجات البراند</h3>
        <div style={S.refCard}>
          <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={hashtags} onChange={(e) => setHashtags(e.target.value)} onBlur={saveHashtags} placeholder="#مثال #هاشتاج_تاني" />
          <button onClick={copyHashtags} style={{ ...S.secondaryBtn, marginTop: 8 }}><Copy size={13} /> {copied ? "اتنسخت" : "انسخ"}</button>
        </div>

        <h3 style={{ ...S.h3, marginTop: 22 }}>قوالب الكابشن حسب النوع</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TYPE_OPTIONS.map((t) => (
            <div key={t} style={S.refCard}>
              <div style={S.refTemplateLabel}>{t}</div>
              <textarea
                style={{ ...S.input, minHeight: 50, resize: "vertical" }}
                defaultValue={templates[t] || ""}
                onBlur={(e) => saveTemplate(t, e.target.value)}
                placeholder={`قالب كابشن جاهز لمحتوى نوع ${t}...`}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={S.h3}><Link2 size={14} style={{ verticalAlign: -2 }} /> ريفرنسات وصفحات بتجيب منها أفكار</h3>
        <div style={S.refCard}>
          <div style={S.formGroup}>
            <label style={S.label}>اسم أو وصف قصير (اختياري)</label>
            <input style={S.input} value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="مثلاً: صفحة إلهام ريلز" />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>اللينك</label>
            <input style={S.input} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addSource(); }} placeholder="لينك الصفحة أو الحساب" />
          </div>
          <button onClick={addSource} style={S.primaryBtn(brand.color)}><Plus size={14} /> ضيف ريفرنس</button>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, maxHeight: 260, overflowY: "auto" }} className="scrollbar">
            {sources.length === 0 && <div style={S.emptyBrands}>لسه مفيش ريفرنسات مسجلة.</div>}
            {sources.map((s) => (
              <div key={s.id} style={S.upcomingRow}>
                <a href={normalizeUrl(s.url)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, textDecoration: "none", color: colors.text }}>
                  <div style={S.upcomingTitle}>{s.title || s.url}</div>
                  {s.title && <div style={S.upcomingMeta}>{s.url}</div>}
                </a>
                <a href={normalizeUrl(s.url)} target="_blank" rel="noopener noreferrer" style={S.ticketIconBtn} title="افتح في تبويبة جديدة"><ExternalLink size={12} /></a>
                <button onClick={() => removeSource(s.id)} style={S.ticketIconBtnDanger}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>

        <h3 style={{ ...S.h3, marginTop: 22 }}><Repeat size={14} style={{ verticalAlign: -2 }} /> أفكار evergreen شهرية</h3>
        <div style={S.refCard}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input style={S.input} value={newEvergreen} onChange={(e) => setNewEvergreen(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addEvergreen(); }} placeholder="فكرة بتتكرر كل شهر..." />
            <button onClick={addEvergreen} style={S.primaryBtn(brand.color)}><Plus size={14} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }} className="scrollbar">
            {evergreen.length === 0 && <div style={S.emptyBrands}>لسه مفيش أفكار evergreen مسجلة.</div>}
            {evergreen.map((e) => (
              <div key={e.id} style={S.upcomingRow}>
                <div style={{ flex: 1, fontSize: 12.5 }}>{e.text}</div>
                <button onClick={() => onUseIdea(brand.id, e.text)} style={S.aiUseBtn}><Plus size={11} /> استخدمها</button>
                <button onClick={() => removeEvergreen(e.id)} style={S.ticketIconBtnDanger}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

/* ---------- Calendar ---------- */

function MonthCalendar({ items, brands, month, setMonth, onDayClick, onItemClick, showBrandColor }) {
  const { y, m } = month;
  const first = new Date(y, m, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const itemsByDate = useMemo(() => {
    const map = {};
    for (const it of items) {
      if (!it.date) continue;
      map[it.date] = map[it.date] || [];
      map[it.date].push(it);
    }
    return map;
  }, [items]);

  const brandColor = (id) => brands.find((b) => b.id === id)?.color || colors.textDim;
  const today = todayISO();

  return (
    <div>
      {showBrandColor && brands.length > 0 && (
        <div style={S.legendRow}>
          {brands.map((b) => (
            <span key={b.id} style={S.legendChip}><span style={{ ...S.dot, background: b.color }} /> {b.name}</span>
          ))}
        </div>
      )}
      <div style={S.calHeader} className="calHeader">
        <button onClick={() => setMonth((cm) => normMonth(cm.y, cm.m - 1))} style={S.iconBtnSm}><ChevronRight size={15} /></button>
        <span style={S.calTitle}>{MONTHS_AR[m]} {y}</span>
        <button onClick={() => setMonth((cm) => normMonth(cm.y, cm.m + 1))} style={S.iconBtnSm}><ChevronLeft size={15} /></button>
      </div>
      <div style={S.calGrid} className="calGrid">
        {WEEKDAYS_AR.map((wd) => <div key={wd} style={S.calWeekday} className="calWeekday">{wd}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} style={S.calCellEmpty} className="calCellEmpty" />;
          const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayItems = itemsByDate[dateStr] || [];
          const isToday = dateStr === today;
          return (
            <div key={i} style={{ ...S.calCell, ...(isToday ? S.calCellToday : {}) }} className="calCell" onClick={() => onDayClick(dateStr)}>
              <div style={S.calDayNum} className="calDayNum">{d}</div>
              <div style={S.calItems}>
                {dayItems.slice(0, 3).map((it) => (
                  <div
                    key={it.id}
                    onClick={(e) => { e.stopPropagation(); onItemClick(it); }}
                    className="calChip"
                    style={{
                      ...S.calChip,
                      background: showBrandColor ? brandColor(it.brandId) + "24" : (STATUS_DEFS.find((s) => s.key === it.status)?.bg),
                      color: showBrandColor ? brandColor(it.brandId) : (STATUS_DEFS.find((s) => s.key === it.status)?.color),
                    }}
                    title={it.title}
                  >
                    {it.title}
                  </div>
                ))}
                {dayItems.length > 3 && <div style={S.calMore}>+{dayItems.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function normMonth(y, m) {
  if (m < 0) return { y: y - 1, m: 11 };
  if (m > 11) return { y: y + 1, m: 0 };
  return { y, m };
}

/* ---------- Modals ---------- */

function ModalShell({ onClose, children, wide }) {
  return (
    <div style={S.overlay} className="overlay" onClick={onClose}>
      <div style={{ ...S.modal, ...(wide ? { maxWidth: 520 } : {}) }} className="scrollbar modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function BrandModal({ brand, onClose, onSave }) {
  const [name, setName] = useState(brand?.name || "");
  const [handle, setHandle] = useState(brand?.handle || "");
  const [emoji, setEmoji] = useState(brand?.emoji || EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(brand?.color || PALETTE[0]);

  return (
    <ModalShell onClose={onClose}>
      <div style={S.modalHead}>
        <span style={S.modalTitle}>{brand ? "عدّل البراند" : "براند جديد"}</span>
        <button onClick={onClose} style={S.iconBtnSm}><X size={16} /></button>
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>اسم البراند</label>
        <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: بن الصباح" />
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>بيانات تواصل (اختياري)</label>
        <input style={S.input} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@account أو رقم موبايل" />
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>أيقونة</label>
        <div style={S.swatchRow}>
          {EMOJI_OPTIONS.map((em) => (
            <button key={em} onClick={() => setEmoji(em)} style={{ ...S.emojiSwatch, ...(emoji === em ? S.emojiSwatchActive : {}) }}>{em}</button>
          ))}
        </div>
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>اللون</label>
        <div style={S.swatchRow}>
          {PALETTE.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{ ...S.colorSwatch, background: c, ...(color === c ? S.colorSwatchActive : {}) }} />
          ))}
        </div>
      </div>
      <div style={S.modalFooter} className="modalFooter">
        <button onClick={onClose} style={S.secondaryBtn}>إلغاء</button>
        <button disabled={!name.trim()} onClick={() => onSave({ id: brand?.id, name: name.trim(), handle: handle.trim(), emoji, color })} style={S.primaryBtn(color)}>
          <Check size={15} /> حفظ
        </button>
      </div>
    </ModalShell>
  );
}

function BulkAddModal({ brand, onClose, onSave }) {
  const [text, setText] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [status, setStatus] = useState("idea");

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <ModalShell onClose={onClose} wide>
      <div style={S.modalHead}>
        <span style={S.modalTitle}><ListPlus size={16} style={{ verticalAlign: -2 }} /> إضافة أفكار بالجملة{brand ? ` لبراند ${brand.name}` : ""}</span>
        <button onClick={onClose} style={S.iconBtnSm}><X size={16} /></button>
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>اكتب عنوان فكرة في كل سطر</label>
        <textarea
          style={{ ...S.input, minHeight: 160, resize: "vertical" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"ريلز عن أسرار القهوة\nبوست تعريفي بالمنتج الجديد\nستوري سؤال وجواب"}
        />
        <p style={S.aiHint}>{lines.length} فكرة هتتضاف. تقدر تعدّل كل واحدة بتفاصيلها بعد ما تضيفها.</p>
      </div>

      <div style={S.rowTwo} className="rowTwo">
        <div style={S.formGroup}>
          <label style={S.label}>النوع (لكل الأفكار)</label>
          <select style={S.input} value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>الحالة (لكل الأفكار)</label>
          <select style={S.input} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_DEFS.map((sd) => <option key={sd.key} value={sd.key}>{sd.label}</option>)}
          </select>
        </div>
      </div>

      <div style={S.modalFooter} className="modalFooter">
        <button onClick={onClose} style={S.secondaryBtn}>إلغاء</button>
        <button disabled={lines.length === 0} onClick={() => onSave(lines, type, status)} style={S.primaryBtn(brand?.color || PALETTE[0])}>
          <ListPlus size={15} /> ضيف {lines.length || ""} فكرة
        </button>
      </div>
    </ModalShell>
  );
}

function ItemModal({ item, brands, defaultBrandId, defaultDate, defaultTitle, defaultNotes, onClose, onSave }) {
  const [title, setTitle] = useState(item?.title || defaultTitle || "");
  const [notes, setNotes] = useState(item?.notes || defaultNotes || "");
  const [link, setLink] = useState(item?.link || "");
  const [referenceLink, setReferenceLink] = useState(item?.referenceLink || "");
  const [type, setType] = useState(item?.type || TYPE_OPTIONS[0]);
  const [status, setStatus] = useState(item?.status || "idea");
  const [date, setDate] = useState(item?.date || defaultDate || "");
  const [reminderDays, setReminderDays] = useState(item?.reminderDays ?? "");
  const [brandId, setBrandId] = useState(item?.brandId || defaultBrandId || "");
  const [views, setViews] = useState(item?.views ?? item?.metric ?? "");
  const [likes, setLikes] = useState(item?.likes ?? "");
  const [comments, setComments] = useState(item?.comments ?? "");
  const [shares, setShares] = useState(item?.shares ?? "");
  const [saves, setSaves] = useState(item?.saves ?? "");
  const [successNote, setSuccessNote] = useState(item?.successNote || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState("");

  async function analyzeLink() {
    if (!link.trim()) return;
    setAnalyzing(true);
    setAnalyzeMsg("");
    try {
      const res = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAnalyzeMsg(data.message || "معرفناش نجيب البيانات، حط الأرقام يدوي.");
      } else {
        if (data.views !== null && data.views !== undefined) setViews(data.views);
        if (data.likes !== null && data.likes !== undefined) setLikes(data.likes);
        if (data.comments !== null && data.comments !== undefined) setComments(data.comments);
        if (data.shares !== null && data.shares !== undefined) setShares(data.shares);
        if (data.saves !== null && data.saves !== undefined) setSaves(data.saves);
        setAnalyzeMsg("تم الجلب، راجع الأرقام تحت.");
      }
    } catch (e) {
      setAnalyzeMsg("حصلت مشكلة في الاتصال، جرب تاني.");
    } finally {
      setAnalyzing(false);
    }
  }

  const brand = brands.find((b) => b.id === brandId);

  return (
    <ModalShell onClose={onClose} wide>
      <div style={S.modalHead}>
        <span style={S.modalTitle}>{item ? "عدّل الفكرة" : "فكرة جديدة"}</span>
        <button onClick={onClose} style={S.iconBtnSm}><X size={16} /></button>
      </div>

      {brands.length > 1 && (
        <div style={S.formGroup}>
          <label style={S.label}>البراند</label>
          <select style={S.input} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.emoji} {b.name}</option>)}
          </select>
        </div>
      )}

      <div style={S.formGroup}>
        <label style={S.label}>العنوان</label>
        <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: ريلز عن طريقة تحضير القهوة" autoFocus />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}><Link2 size={12} style={{ verticalAlign: -1 }} /> لينك الريفرنس (المصدر اللي جبت منه الفكرة)</label>
        <input style={S.input} value={referenceLink} onChange={(e) => setReferenceLink(e.target.value)} placeholder="لينك المحتوى اللي استلهمت منه الفكرة" />
      </div>

      <div style={S.rowTwo} className="rowTwo">
        <div style={S.formGroup}>
          <label style={S.label}>النوع</label>
          <select style={S.input} value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>معاد التسليم/النشر (اختياري)</label>
          <input type="date" style={S.input} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {date && (
        <div style={S.formGroup}>
          <label style={S.label}><Bell size={12} style={{ verticalAlign: -1 }} /> ذكّرني قبل الميعاد بكام يوم؟ (اختياري)</label>
          <input
            type="number" min="0" max="60" style={S.input}
            value={reminderDays}
            onChange={(e) => setReminderDays(e.target.value)}
            placeholder="مثلاً 2 (يذكّرك قبل الميعاد بيومين)"
          />
        </div>
      )}

      <div style={S.formGroup}>
        <label style={S.label}><Link2 size={12} style={{ verticalAlign: -1 }} /> لينك الفيديو أو البوست بعد النشر (اختياري)</label>
        <input style={S.input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="حط اللينك بعد ما تنزل المحتوى" />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>نتيجة النشر (اختياري، تملاها بعد ما المحتوى ينزل)</label>

        {link.trim() && (
          <div style={{ marginBottom: 10 }}>
            <button type="button" onClick={analyzeLink} disabled={analyzing} style={S.secondaryBtn}>
              {analyzing ? "بيجيب البيانات..." : "🔍 اجلب الأرقام تلقائي من اللينك"}
            </button>
            {analyzeMsg && <p style={{ ...S.aiHint, marginTop: 6 }}>{analyzeMsg}</p>}
          </div>
        )}

        <div style={{ ...S.rowTwo, marginTop: 4 }} className="rowTwo">
          <div>
            <label style={S.label}>المشاهدات</label>
            <input type="number" min="0" style={S.input} value={views} onChange={(e) => setViews(e.target.value)} placeholder="بعد النشر" />
          </div>
          <div>
            <label style={S.label}>اللايكات</label>
            <input type="number" min="0" style={S.input} value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="بعد النشر" />
          </div>
        </div>
        <div style={{ ...S.rowTwo, marginTop: 10 }} className="rowTwo">
          <div>
            <label style={S.label}>الكومنتات</label>
            <input type="number" min="0" style={S.input} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="بعد النشر" />
          </div>
          <div>
            <label style={S.label}>المشاركات (Shares)</label>
            <input type="number" min="0" style={S.input} value={shares} onChange={(e) => setShares(e.target.value)} placeholder="بعد النشر" />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={S.label}>الحفظ (Saves)</label>
          <input type="number" min="0" style={S.input} value={saves} onChange={(e) => setSaves(e.target.value)} placeholder="بعد النشر" />
        </div>
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>الحالة</label>
        <div style={S.statusPicker}>
          {STATUS_DEFS.map((sd) => (
            <button
              key={sd.key}
              onClick={() => setStatus(sd.key)}
              style={{ ...S.statusPickerBtn, color: sd.color, background: status === sd.key ? sd.bg : "transparent", borderColor: status === sd.key ? sd.color : colors.borderStrong }}
            >
              {status === sd.key ? <CheckCircle2 size={13} /> : <Circle size={13} />} {sd.label}
            </button>
          ))}
        </div>
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>ملاحظات (اختياري)</label>
        <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="تفاصيل، كابشن..." />
      </div>

      <div style={S.formGroup}>
        <label style={S.label}>ليه نجحت؟ (اختياري)</label>
        <textarea style={{ ...S.input, minHeight: 50, resize: "vertical" }} value={successNote} onChange={(e) => setSuccessNote(e.target.value)} placeholder="ملاحظة سريعة ليه المحتوى ده اشتغل كويس..." />
      </div>

      <div style={S.modalFooter} className="modalFooter">
        <button onClick={onClose} style={S.secondaryBtn}>إلغاء</button>
        <button
          disabled={!title.trim() || !brandId}
          onClick={() => onSave({
            id: item?.id, brandId, title: title.trim(), notes: notes.trim(), link: link.trim(), referenceLink: referenceLink.trim(),
            type, status, date,
            reminderDays: reminderDays === "" ? null : Number(reminderDays),
            views: views === "" ? null : Number(views),
            likes: likes === "" ? null : Number(likes),
            comments: comments === "" ? null : Number(comments),
            shares: shares === "" ? null : Number(shares),
            saves: saves === "" ? null : Number(saves),
            successNote: successNote.trim(),
          })}
          style={S.primaryBtn(brand?.color || PALETTE[0])}
        >
          <Save size={15} /> حفظ
        </button>
      </div>
    </ModalShell>
  );
}

function ConfirmModal({ text, onCancel, onConfirm, confirmLabel, confirmIcon, danger = true }) {
  return (
    <ModalShell onClose={onCancel}>
      <div style={S.modalTitle}>متأكد؟</div>
      <p style={S.confirmText}>{text}</p>
      <div style={S.modalFooter} className="modalFooter">
        <button onClick={onCancel} style={S.secondaryBtn}>رجوع</button>
        <button onClick={onConfirm} style={danger ? S.dangerBtn : S.primaryBtn(colors.warning)}>
          {confirmIcon || (danger && <Trash2 size={14} />)} {confirmLabel || "مسح نهائي"}
        </button>
      </div>
    </ModalShell>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={S.sectionHeader} className="sectionHeader">
      <span style={S.sectionHeaderIcon}>{icon}</span>
      <div>
        <h2 style={S.sectionHeaderTitle} className="sectionHeaderTitle">{title}</h2>
        {subtitle && <p style={S.sectionHeaderSub} className="sectionHeaderSub">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const S = {
  app: { position: "relative", display: "flex", minHeight: 640, background: colors.bg, color: colors.text, borderRadius: radius.lg, overflow: "hidden", border: `1px solid ${colors.border}` },
  loadingWrap: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: colors.textDim, fontSize: 14 },
  sidebar: { width: 260, background: colors.surface, borderLeft: `1px solid ${colors.border}`, padding: "18px 14px", flexShrink: 0, maxHeight: 720, overflowY: "auto" },
  brandMark: { display: "flex", alignItems: "center", gap: 10 },
  brandMarkDot: { width: 32, height: 32, borderRadius: radius.sm, background: colors.accentGradient, boxShadow: shadows.accentGlow },
  brandMarkTitle: { fontSize: 15, fontWeight: 800, color: colors.text },
  brandMarkSub: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: colors.textFaint, marginTop: 2 },
  syncDot: { width: 5, height: 5, borderRadius: "50%", flexShrink: 0 },
  sidebarCloseBtn: { width: 30, height: 30, borderRadius: radius.sm, background: colors.card, border: `1px solid ${colors.border}`, color: colors.textDim, cursor: "pointer", alignItems: "center", justifyContent: "center" },
  sidebarDivider: { height: 1, background: colors.border, margin: "18px 0 12px" },
  sidebarAccount: { display: "flex", flexDirection: "column", gap: 8 },
  sidebarAccountEmail: { fontSize: 10.5, color: colors.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  notifBtn: { display: "flex", alignItems: "center", gap: 6, width: "100%", marginTop: 12, background: softBg.warning, border: `1px solid ${borderTint.warning}`, color: colors.warning, padding: "8px 10px", borderRadius: radius.sm, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  reminderBanner: { background: softBg.warning, border: `1px solid ${borderTint.warning}`, borderRadius: radius.md, padding: 14, marginBottom: 20 },
  reminderBannerHead: { display: "flex", alignItems: "center", gap: 6, color: colors.warning, fontSize: 13, fontWeight: 800 },
  reminderRow: { display: "flex", alignItems: "center", gap: 8, background: colors.card, borderRadius: 8, padding: "7px 10px" },
  sidebarLabelRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 8px" },
  sidebarLabel: { fontSize: 11, color: colors.textFaint, fontWeight: 700, letterSpacing: 0.3 },
  navItem: { position: "relative", width: "100%", display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", color: colors.textDim, padding: "9px 12px", borderRadius: radius.sm, fontSize: 13.5, cursor: "pointer", textAlign: "right", fontFamily: "inherit" },
  navItemActive: { background: colors.accentGradientSoft, color: colors.text, fontWeight: 700 },
  navItemIndicator: { position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, background: colors.accentGradient },
  emptyBrands: { fontSize: 12, color: colors.textFaint, padding: "6px 4px", lineHeight: 1.7 },
  brandTabRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 },
  brandTab: { flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 9, position: "relative", background: colors.card, border: `1px solid ${colors.border}`, color: colors.textDim, padding: "9px 10px 9px 14px", borderRadius: radius.sm, fontSize: 13, cursor: "pointer", textAlign: "right", overflow: "hidden", fontFamily: "inherit" },
  brandTabActive: (color) => ({ background: color + "1A", border: `1px solid ${color}55`, color: colors.text, fontWeight: 700 }),
  brandTabStripe: { position: "absolute", right: 0, top: 0, bottom: 0, width: 3 },
  brandTabEmoji: { fontSize: 14 },
  brandTabName: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  brandDeleteBtn: { flexShrink: 0, width: 30, height: 34, borderRadius: radius.sm, background: colors.card, border: `1px solid ${colors.border}`, color: colors.textDim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  upgradeBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 10, background: colors.accentGradient, border: "none", color: colors.onAccent, padding: "10px", borderRadius: radius.sm, fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  main: { flex: 1, overflowY: "auto", padding: "26px 30px", maxHeight: 720, position: "relative" },
  section: {},
  sectionHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 22 },
  sectionHeaderIcon: { width: 38, height: 38, borderRadius: 10, background: colors.card, display: "flex", alignItems: "center", justifyContent: "center", color: colors.warning },
  sectionHeaderTitle: { fontSize: 19, fontWeight: 800, margin: 0 },
  sectionHeaderSub: { fontSize: 12.5, color: colors.textDim, margin: "3px 0 0" },
  statRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12, marginBottom: 26 },
  statCard: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "14px 16px" },
  statValue: { fontSize: 22, fontWeight: 800 },
  statLabel: { fontSize: 11.5, color: colors.textDim, marginTop: 2 },
  dashGrid: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 28, alignItems: "start" },

  /* New Home Dashboard tokens (Redesign phase 1) */
  dashHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  dashGreeting: { fontSize: 20, fontWeight: 800, margin: 0, color: colors.text },
  dashGreetingSub: { fontSize: 12.5, color: colors.textDim, margin: "4px 0 0" },
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 24 },
  kpiCard: { display: "flex", alignItems: "center", gap: 10, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "12px 14px" },
  kpiIcon: { width: 30, height: 30, borderRadius: 9, background: colors.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  kpiValue: { fontSize: 18, fontWeight: 800, lineHeight: 1.2 },
  kpiLabel: { fontSize: 10.5, color: colors.textDim, marginTop: 1 },
  dashSection: { marginBottom: 26 },
  dashSectionTitle: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, margin: "0 0 12px", color: colors.textDim },
  financeRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 },
  financeCard: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "14px 16px" },
  financeLabel: { fontSize: 11, color: colors.textDim },
  financeValue: { fontSize: 19, fontWeight: 800, marginTop: 4, color: colors.text },
  financeTrend: { display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 700, marginTop: 6 },
  financeFooterRow: { display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 12, fontSize: 11.5, color: colors.textDim },
  dashTwoCol: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28, alignItems: "start" },
  compactList: { display: "flex", flexDirection: "column", gap: 7 },
  compactRow: { display: "flex", alignItems: "center", gap: 9, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 9, padding: "8px 11px" },
  attentionRow: { display: "flex", alignItems: "center", gap: 9, background: colors.card, border: `1px solid ${borderTint.danger}`, borderRadius: 9, padding: "8px 11px" },
  attentionIcon: { color: colors.danger, display: "flex", flexShrink: 0 },
  attentionTag: { fontSize: 10, fontWeight: 700, color: colors.danger, background: "rgba(217,112,122,0.14)", padding: "3px 8px", borderRadius: 999, flexShrink: 0, whiteSpace: "nowrap" },
  brandMiniList: { display: "flex", flexDirection: "column", gap: 7 },
  brandMiniCard: { display: "flex", alignItems: "center", gap: 10, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "9px 10px", cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "right" },
  brandMiniName: { fontSize: 12.5, fontWeight: 700, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  brandMiniMeta: { fontSize: 10.5, color: colors.textFaint, marginTop: 1 },
  brandMiniAdd: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: `1.5px dashed ${colors.borderStrong}`, color: colors.textDim, borderRadius: 10, padding: "9px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 12 },
  chartCard: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "16px 8px 8px" },

  /* Top header */
  topHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` },
  topHeaderUser: { display: "flex", alignItems: "center", gap: 10 },
  topHeaderAvatar: { width: 38, height: 38, borderRadius: "50%", background: colors.accentGradient, color: colors.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 },
  topHeaderName: { fontSize: 13, fontWeight: 700, color: colors.text },
  topHeaderPlanBadge: { fontSize: 10.5, fontWeight: 700, marginTop: 1 },
  topHeaderActions: { display: "flex", alignItems: "center", gap: 8 },
  topHeaderIconBtn: { position: "relative", width: 36, height: 36, borderRadius: radius.sm, background: colors.card, border: `1px solid ${colors.border}`, color: colors.textDim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  topHeaderBadge: { position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: radius.pill, background: colors.danger, color: "#fff", fontSize: 9.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" },
  notifDropdown: { position: "absolute", top: 44, left: 0, width: 260, background: colors.surface, border: `1px solid ${colors.borderStrong}`, borderRadius: radius.md, padding: 12, zIndex: 50, boxShadow: shadows.lg },
  notifDropdownTitle: { fontSize: 12, fontWeight: 800, color: colors.text, marginBottom: 8 },
  notifRow: { display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", borderBottom: `1px solid ${colors.border}`, fontSize: 11.5, color: colors.textDim },
  notifRowText: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  perfTotalsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 10 },
  perfTotalsCol: { display: "flex", flexDirection: "column", gap: 8 },
  perfTotalsLabel: { fontSize: 11.5, color: colors.textDim, fontWeight: 700 },
  h3: { fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: colors.textDim },
  brandCardGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  idCard: { position: "relative", background: colors.card, border: "1px solid", borderRadius: 13, padding: "16px 14px 14px", textAlign: "right", cursor: "pointer", overflow: "hidden", fontFamily: "inherit" },
  idCardStripe: { position: "absolute", top: 0, right: 0, left: 0, height: 3 },
  idCardTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  idCardAvatar: { width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  idCardName: { fontSize: 14, fontWeight: 700, color: colors.text },
  idCardHandle: { fontSize: 11, color: colors.textFaint, marginTop: 1 },
  idCardStats: { display: "flex", flexWrap: "wrap", gap: 5, borderTop: `1px dashed ${colors.borderStrong}`, paddingTop: 10 },
  idCardChip: { fontSize: 10.5, padding: "3px 7px", borderRadius: 6, fontWeight: 700 },
  dashedAddCard: { width: "100%", border: `1.5px dashed ${colors.borderStrong}`, borderRadius: 13, background: "transparent", color: colors.textDim, padding: "26px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  dashedAddCardSmall: { border: `1.5px dashed ${colors.borderStrong}`, borderRadius: 13, background: "transparent", color: colors.textDim, padding: "14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit", minHeight: 96 },
  upcomingList: { display: "flex", flexDirection: "column", gap: 8 },
  upcomingRow: { display: "flex", alignItems: "center", gap: 10, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "9px 12px" },
  taskRow: { display: "flex", alignItems: "center", gap: 8, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 9, padding: "7px 10px" },
  taskCheckBtn: { background: "transparent", border: "none", color: colors.textDim, cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 },
  taskText: { fontSize: 12.5, color: colors.text, flex: 1 },
  searchBar: { display: "flex", gap: 8, flexWrap: "wrap" },
  searchResultRow: { display: "flex", alignItems: "center", gap: 10, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "9px 12px", width: "100%", cursor: "pointer", fontFamily: "inherit", textAlign: "right" },
  compareTable: { width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 560 },
  compareTh: { textAlign: "right", padding: "8px 10px", color: colors.textDim, fontWeight: 700, fontSize: 11.5, borderBottom: `1px solid ${colors.border}` },
  compareTr: { cursor: "pointer" },
  compareTd: { padding: "10px 10px", color: colors.text, borderBottom: `1px solid ${colors.card}` },
  compareTdName: { padding: "10px 10px", color: colors.text, borderBottom: `1px solid ${colors.card}`, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  upcomingTitle: { fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  upcomingMeta: { fontSize: 11, color: colors.textFaint, marginTop: 1 },
  miniBadge: { fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3 },

  idBadge: { position: "relative", background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 18 },
  idBadgeStripe: { height: 4 },
  idBadgeInner: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" },
  idBadgeAvatar: { width: 42, height: 42, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 },
  idBadgeName: { fontSize: 17, fontWeight: 800 },
  idBadgeHandle: { fontSize: 12, color: colors.textDim, marginTop: 1 },

  tabRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  tabBtn: { display: "flex", alignItems: "center", gap: 7, background: "transparent", border: `1px solid ${colors.border}`, color: colors.textDim, padding: "8px 14px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  tabBtnActive: { background: colors.card, color: colors.text, borderColor: colors.borderStrong, fontWeight: 700 },

  board: { display: "grid", gridTemplateColumns: "repeat(4,minmax(220px,1fr))", gap: 12, overflowX: "auto" },
  column: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, display: "flex", flexDirection: "column", maxHeight: 560, transition: "border-color .12s" },
  columnHead: { display: "flex", alignItems: "center", gap: 8, padding: "12px 12px 10px" },
  columnTitle: { fontSize: 12.5, fontWeight: 700, flex: 1 },
  columnCount: { fontSize: 11, color: colors.textFaint, background: colors.card, padding: "1px 7px", borderRadius: 999 },
  columnBody: { padding: "0 10px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, flex: 1 },
  columnEmpty: { fontSize: 11.5, color: colors.textFaint, textAlign: "center", padding: "18px 0" },
  ticket: { background: colors.card, border: `1px solid ${colors.border}`, borderTop: "2.5px solid", borderRadius: 10, padding: "10px 11px 9px" },
  ticketHead: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 },
  ticketType: { fontSize: 10, fontWeight: 700, color: colors.textDim, background: colors.surface, padding: "2px 7px", borderRadius: 5, flex: 1 },
  ticketIconBtn: { background: "transparent", border: "none", color: colors.textFaint, cursor: "pointer", padding: 3, display: "flex" },
  ticketIconBtnDanger: { background: "transparent", border: "none", color: colors.textFaint, cursor: "pointer", padding: 3 },
  ticketTitle: { fontSize: 13, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 },
  ticketNotes: { fontSize: 11.5, color: colors.textDim, lineHeight: 1.6, marginBottom: 6 },
  ticketBadgesRow: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 },
  badgeDanger: { display: "flex", alignItems: "center", gap: 3, fontSize: 9.5, fontWeight: 700, color: colors.danger, background: "rgba(217,112,122,0.16)", padding: "2px 6px", borderRadius: 5 },
  badgeWarning: { display: "flex", alignItems: "center", gap: 3, fontSize: 9.5, fontWeight: 700, color: colors.warning, background: "rgba(231,163,62,0.16)", padding: "2px 6px", borderRadius: 5 },
  badgeGeneric: { display: "flex", alignItems: "center", gap: 3, fontSize: 9.5, fontWeight: 700, color: colors.textDim, background: colors.surface, padding: "2px 6px", borderRadius: 5 },
  ticketFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px dashed ${colors.borderStrong}`, paddingTop: 7, marginTop: 4 },
  ticketDate: { fontSize: 10.5, color: colors.textFaint },
  ticketMoveLabel: { display: "block", fontSize: 10, color: colors.textFaint, fontWeight: 600, marginTop: 8 },
  ticketStatusSelect: { width: "100%", background: colors.surface, border: `1px solid ${colors.borderStrong}`, borderRadius: 7, color: colors.text, fontSize: 11.5, padding: "6px 8px", fontFamily: "inherit", marginTop: 4, cursor: "pointer" },
  moveTextBtn: { width: "100%", marginTop: 6, background: "transparent", border: `1px dashed ${borderTint.warning}`, color: colors.warning, fontSize: 10.5, fontWeight: 700, borderRadius: 7, padding: "6px 8px", cursor: "pointer", fontFamily: "inherit" },
  perfToggleBtn: { display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: colors.textDim, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 },
  perfPanel: { background: colors.surface, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: 8, marginTop: 6 },
  perfLinkLabel: { display: "block", fontSize: 10, color: colors.textFaint, fontWeight: 600, marginBottom: 4 },
  perfInputsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginTop: 6 },
  perfInput: { width: "100%", background: colors.card, border: `1px solid ${colors.borderStrong}`, borderRadius: 6, color: colors.text, padding: "5px 6px", fontSize: 10.5, fontFamily: "inherit", outline: "none" },

  calHeader: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 14 },
  calTitle: { fontSize: 14.5, fontWeight: 700, minWidth: 110, textAlign: "center" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 },
  calWeekday: { fontSize: 11, color: colors.textFaint, textAlign: "center", paddingBottom: 4, fontWeight: 700 },
  calCellEmpty: { minHeight: 74, borderRadius: 9 },
  calCell: { minHeight: 74, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 9, padding: "6px 6px", cursor: "pointer" },
  calCellToday: { borderColor: borderTint.warning },
  calDayNum: { fontSize: 11, color: colors.textDim, marginBottom: 4, textAlign: "left" },
  calItems: { display: "flex", flexDirection: "column", gap: 3 },
  calChip: { fontSize: 9.5, fontWeight: 700, padding: "2px 5px", borderRadius: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  calMore: { fontSize: 9, color: colors.textFaint },
  legendRow: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14, justifyContent: "center" },
  legendChip: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: colors.textDim },

  barList: { display: "flex", flexDirection: "column", gap: 9 },
  barRow: { display: "flex", alignItems: "center", gap: 10 },
  barLabel: { fontSize: 11.5, color: colors.textDim, width: 70, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  barTrack: { flex: 1, height: 8, background: colors.card, borderRadius: 6, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6 },
  barValue: { fontSize: 11, color: colors.textDim, width: 20, textAlign: "left" },
  mixRow: { display: "flex", alignItems: "center", gap: 10 },
  mixTargetMarker: { position: "absolute", top: 0, bottom: 0, width: 2, background: colors.text, opacity: 0.85 },
  mixTargetInput: { width: 46, background: colors.surface, border: `1px solid ${colors.borderStrong}`, borderRadius: 6, color: colors.text, fontSize: 10.5, padding: "3px 4px", fontFamily: "inherit", textAlign: "center", flexShrink: 0 },

  leaderboard: { display: "flex", flexDirection: "column", gap: 8 },
  leaderRow: { display: "flex", alignItems: "center", gap: 10, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "9px 12px" },
  leaderRank: { width: 20, height: 20, borderRadius: 6, background: colors.surface, color: colors.warning, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  leaderNote: { fontSize: 10.5, color: colors.textFaint, marginTop: 2, fontStyle: "italic" },

  refCard: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 14 },
  refTemplateLabel: { fontSize: 11.5, fontWeight: 700, color: colors.textDim, marginBottom: 6 },

  aiAnalysisCard: { background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, minHeight: 90 },
  sectionCheckGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "10px 0 16px" },
  sectionCheckLabel: { display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: colors.textDim, cursor: "pointer" },
  reportPreview: { background: "#ffffff", color: "#1A1A1A", borderRadius: 10, padding: 22, maxHeight: 400, overflowY: "auto" },
  reportPreviewTitle: { fontSize: 18, fontWeight: 800, margin: "0 0 2px" },
  reportPreviewDate: { fontSize: 11, color: "#666", margin: "0 0 16px" },
  reportSection: { marginBottom: 14 },
  reportSectionTitle: { fontSize: 13, fontWeight: 800, color: "#B8722E", margin: "0 0 6px", borderBottom: "1px solid #eee", paddingBottom: 4 },
  reportP: { fontSize: 12, lineHeight: 1.8, margin: "0 0 4px", color: "#333" },
  aiAnalysisText: { fontSize: 13, lineHeight: 1.9, color: colors.textDim, whiteSpace: "pre-wrap", margin: "0 0 12px" },
  aiLoadingRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: colors.textDim },
  aiError: { fontSize: 12, color: colors.danger },
  aiHint: { fontSize: 11.5, color: colors.textFaint, margin: "10px 0 0", lineHeight: 1.7 },

  overlay: { position: "fixed", inset: 0, background: "rgba(6,9,11,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 },
  modal: { width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto", background: colors.surface, border: `1px solid ${colors.borderStrong}`, borderRadius: 14, padding: 20, direction: "rtl" },
  modalHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 15.5, fontWeight: 800 },
  formGroup: { marginBottom: 14 },
  rowTwo: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  label: { display: "block", fontSize: 12, color: colors.textDim, marginBottom: 6, fontWeight: 600 },
  input: { width: "100%", background: colors.card, border: `1px solid ${colors.borderStrong}`, borderRadius: 9, color: colors.text, padding: "9px 11px", fontSize: 13.5, fontFamily: "inherit", outline: "none" },
  swatchRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  emojiSwatch: { width: 34, height: 34, borderRadius: 9, background: colors.card, border: `1.5px solid ${colors.borderStrong}`, fontSize: 15, cursor: "pointer" },
  emojiSwatchActive: { borderColor: colors.warning },
  colorSwatch: { width: 26, height: 26, borderRadius: "50%", border: "2px solid transparent", cursor: "pointer" },
  colorSwatchActive: { border: `2px solid ${colors.text}` },
  statusPicker: { display: "flex", flexWrap: "wrap", gap: 7 },
  statusPickerBtn: { display: "flex", alignItems: "center", gap: 5, border: "1.3px solid", borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "transparent", fontFamily: "inherit" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 },
  secondaryBtn: { background: "transparent", border: `1px solid ${colors.borderStrong}`, color: colors.textDim, padding: "9px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  dangerBtn: { display: "flex", alignItems: "center", gap: 6, background: softBg.danger, border: `1px solid ${borderTint.danger}`, color: colors.danger, padding: "9px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 },
  primaryBtn: (color) => ({ display: "flex", alignItems: "center", gap: 6, background: color, border: "none", color: colors.surface, padding: "9px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontWeight: 800, fontFamily: "inherit" }),
  confirmText: { fontSize: 13, color: colors.textDim, lineHeight: 1.7, margin: "10px 0 18px" },

  iconBtnSm: { width: 28, height: 28, borderRadius: 8, background: colors.card, border: `1px solid ${colors.border}`, color: colors.textDim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  iconBtnSmDanger: { width: 28, height: 28, borderRadius: 8, background: colors.card, border: `1px solid ${colors.border}`, color: colors.danger, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  aiFab: { position: "absolute", bottom: 18, right: 18, width: 46, height: 46, borderRadius: "50%", background: colors.warning, border: "none", color: colors.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 40 },
  aiPanel: { position: "absolute", bottom: 74, right: 18, width: 320, maxHeight: 440, background: colors.surface, border: `1px solid ${colors.borderStrong}`, borderRadius: 14, display: "flex", flexDirection: "column", zIndex: 45, overflow: "hidden" },
  aiPanelHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: `1px solid ${colors.border}` },
  aiMessages: { flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 8, minHeight: 160 },
  aiEmpty: { fontSize: 11.5, color: colors.textFaint, lineHeight: 1.8, padding: "10px 4px" },
  aiMsg: { fontSize: 12.5, lineHeight: 1.7, padding: "8px 10px", borderRadius: 10, maxWidth: "92%" },
  aiMsgUser: { background: softBg.warning, color: colors.text, alignSelf: "flex-start" },
  aiMsgAssistant: { background: colors.card, color: colors.textDim, alignSelf: "flex-end", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 },
  aiUseBtn: { display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: colors.warning, background: "transparent", border: `1px solid ${borderTint.warning}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontFamily: "inherit" },
  aiInputRow: { display: "flex", gap: 6, padding: "10px", borderTop: `1px solid ${colors.border}` },
  aiInput: { flex: 1, background: colors.card, border: `1px solid ${colors.borderStrong}`, borderRadius: 9, color: colors.text, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", outline: "none" },
  aiSendBtn: { width: 34, height: 34, borderRadius: 9, background: colors.warning, border: "none", color: colors.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
};
