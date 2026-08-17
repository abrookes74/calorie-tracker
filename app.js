
const cfg = window.APP_CONFIG || {};
const client = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);

let session = null;
let selectedDate = new Date();
let profile = { daily_calorie_target: 2000 };
let foods = [];
let recipes = [];
let recipeItems = [];
let diary = [];

const $ = s => document.querySelector(s);
const fmt = n => Math.round(Number(n) || 0);
const escapeHtml = (s="") => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const localDateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const els = {
  authView: $("#authView"), appView: $("#appView"), authForm: $("#authForm"),
  authEmail: $("#authEmail"), authPassword: $("#authPassword"), authMessage: $("#authMessage"),
  selectedDateLabel: $("#selectedDateLabel"), caloriesLeft: $("#caloriesLeft"),
  targetCalories: $("#targetCalories"), eatenCalories: $("#eatenCalories"), progressBar: $("#progressBar"),
  mealSections: $("#mealSections"), foodList: $("#foodList"), foodSearch: $("#foodSearch"),
  recipeList: $("#recipeList"), accountDialog: $("#accountDialog"), accountEmail: $("#accountEmail"),
  targetInput: $("#targetInput"), foodDialog: $("#foodDialog"), foodForm: $("#foodForm"),
  foodId: $("#foodId"), foodName: $("#foodName"), foodCalories: $("#foodCalories"),
  foodBaseAmount: $("#foodBaseAmount"), foodUnit: $("#foodUnit"), foodServing: $("#foodServing"),
  foodDialogTitle: $("#foodDialogTitle"), recipeDialog: $("#recipeDialog"), recipeForm: $("#recipeForm"),
  recipeId: $("#recipeId"), recipeName: $("#recipeName"), recipeServings: $("#recipeServings"),
  ingredientRows: $("#ingredientRows"), recipeTotalCalories: $("#recipeTotalCalories"),
  recipePerServing: $("#recipePerServing"), addDiaryDialog: $("#addDiaryDialog"),
  diaryMeal: $("#diaryMeal"), diaryItemSelect: $("#diaryItemSelect"), diaryQuantity: $("#diaryQuantity"),
  diaryUnitHint: $("#diaryUnitHint"), diaryCalculatedCalories: $("#diaryCalculatedCalories")
};

function validateConfig() {
  return cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY &&
    !cfg.SUPABASE_URL.includes("YOUR_PROJECT") &&
    !cfg.SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE");
}

async function init() {
  if (!validateConfig()) {
    els.authMessage.textContent = "Configure Supabase in config.js before using the app.";
    return;
  }
  const { data: { session: s } } = await client.auth.getSession();
  session = s;
  client.auth.onAuthStateChange(async (_event, s2) => {
    session = s2;
    await handleSession();
  });
  await handleSession();
}

async function handleSession() {
  const signedIn = !!session?.user;
  els.authView.hidden = signedIn;
  els.appView.hidden = !signedIn;
  if (!signedIn) return;
  els.accountEmail.textContent = session.user.email || "";
  await ensureProfile();
  await refreshCoreData();
  await refreshDiary();
}

async function ensureProfile() {
  const uid = session.user.id;
  let { data: p, error } = await client.from("profiles").select("*").eq("user_id", uid).maybeSingle();
  if (error) throw error;
  if (!p) {
    const ins = await client.from("profiles").insert({ user_id: uid, daily_calorie_target: 2000 }).select().single();
    if (ins.error) throw ins.error;
    p = ins.data;
  }
  profile = p;
}

async function refreshCoreData() {
  const uid = session.user.id;
  const [fres, rres, ires] = await Promise.all([
    client.from("foods").select("*").eq("user_id", uid).order("name"),
    client.from("recipes").select("*").eq("user_id", uid).order("name"),
    client.from("recipe_items").select("*").eq("user_id", uid)
  ]);
  if (fres.error) throw fres.error; if (rres.error) throw rres.error; if (ires.error) throw ires.error;
  foods = fres.data || []; recipes = rres.data || []; recipeItems = ires.data || [];
  renderFoods(); renderRecipes(); renderSummary();
}

async function refreshDiary() {
  if (!session) return;
  const { data, error } = await client.from("diary_entries")
    .select("*").eq("user_id", session.user.id).eq("entry_date", localDateKey(selectedDate))
    .order("created_at");
  if (error) throw error;
  diary = data || [];
  renderDiary(); renderSummary(); renderDate();
}

function renderDate() {
  els.selectedDateLabel.textContent = new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"long",year:"numeric"}).format(selectedDate);
}
function eatenToday(){ return diary.reduce((s,x)=>s+Number(x.calories),0); }
function renderSummary() {
  const eaten = eatenToday(), target = Number(profile.daily_calorie_target || 2000), left = target-eaten;
  els.targetCalories.textContent = fmt(target); els.eatenCalories.textContent = fmt(eaten); els.caloriesLeft.textContent = fmt(left);
  els.progressBar.style.width = `${Math.max(0,Math.min(100,target ? eaten/target*100 : 0))}%`;
}
function renderDiary() {
  const meals = ["Breakfast","Lunch","Dinner","Snacks"];
  els.mealSections.innerHTML = meals.map(meal=>{
    const rows = diary.filter(x=>x.meal_type===meal);
    const total = rows.reduce((s,x)=>s+Number(x.calories),0);
    return `<section class="meal-section">
      <div class="meal-heading"><h3>${meal}</h3><span class="meal-total">${fmt(total)} kcal</span></div>
      <div class="meal-card">${rows.length ? rows.map(x=>`
        <div class="diary-row">
          <div><div class="name">${escapeHtml(x.item_name)}</div><div class="meta">${escapeHtml(x.quantity_label || "")}</div></div>
          <div class="calories">${fmt(x.calories)} kcal</div>
          <button class="remove-btn" data-action="remove-diary" data-id="${x.id}" aria-label="Remove">✕</button>
        </div>`).join("") : `<div class="empty">Nothing added.</div>`}</div>
    </section>`;
  }).join("");
}
function renderFoods() {
  const q = els.foodSearch.value.trim().toLowerCase();
  const list = foods.filter(x=>x.name.toLowerCase().includes(q));
  els.foodList.innerHTML = list.length ? list.map(f=>`
    <div class="item-card">
      <div><div class="name">${escapeHtml(f.name)}</div>
      <div class="meta">${fmt(f.calories)} kcal per ${f.base_amount} ${escapeHtml(f.unit)}${f.serving_description ? " • "+escapeHtml(f.serving_description):""}</div>
      <div class="item-actions"><button class="small-btn" data-action="edit-food" data-id="${f.id}">Edit</button><button class="small-btn" data-action="delete-food" data-id="${f.id}">Delete</button></div></div>
      <div class="calories">${fmt(f.calories)} kcal</div>
    </div>`).join("") : `<div class="empty">No foods found.</div>`;
}
function recipeCalories(recipeId) {
  const items = recipeItems.filter(x=>x.recipe_id===recipeId);
  return items.reduce((sum,it)=>{
    const f=foods.find(x=>x.id===it.food_id); if(!f) return sum;
    return sum + Number(f.calories) * (Number(it.amount)/Number(f.base_amount));
  },0);
}
function renderRecipes() {
  els.recipeList.innerHTML = recipes.length ? recipes.map(r=>{
    const total=recipeCalories(r.id), per=total/Number(r.servings||1);
    return `<div class="item-card"><div><div class="name">${escapeHtml(r.name)}</div>
      <div class="meta">${r.servings} servings • ${fmt(total)} kcal total</div>
      <div class="item-actions"><button class="small-btn" data-action="edit-recipe" data-id="${r.id}">Edit</button><button class="small-btn" data-action="delete-recipe" data-id="${r.id}">Delete</button></div></div>
      <div class="calories">${fmt(per)} kcal/serving</div></div>`;
  }).join("") : `<div class="empty">No recipes yet.</div>`;
}

els.authForm.addEventListener("submit", async e=>{
  e.preventDefault(); els.authMessage.textContent="Signing in...";
  const { error } = await client.auth.signInWithPassword({email:els.authEmail.value.trim(),password:els.authPassword.value});
  els.authMessage.textContent = error ? error.message : "";
});
$("#signUpBtn").onclick = async ()=>{
  els.authMessage.textContent="Creating account...";
  const { error } = await client.auth.signUp({email:els.authEmail.value.trim(),password:els.authPassword.value});
  els.authMessage.textContent = error ? error.message : "Account created. Check your email if confirmation is enabled.";
};
$("#signOutBtn").onclick = async ()=>{ els.accountDialog.close(); await client.auth.signOut(); };

$("#accountBtn").onclick=()=>{
  if(!session) return;
  els.targetInput.value=profile.daily_calorie_target || 2000; els.accountDialog.showModal();
};
$("#saveTargetBtn").onclick=async e=>{
  e.preventDefault();
  const val=Number(els.targetInput.value);
  const { error }=await client.from("profiles").update({daily_calorie_target:val}).eq("user_id",session.user.id);
  if(error) return alert(error.message);
  profile.daily_calorie_target=val; renderSummary(); els.accountDialog.close();
};

$("#prevDayBtn").onclick=async()=>{selectedDate.setDate(selectedDate.getDate()-1); await refreshDiary();}
$("#nextDayBtn").onclick=async()=>{selectedDate.setDate(selectedDate.getDate()+1); await refreshDiary();}
$("#todayBtn").onclick=async()=>{selectedDate=new Date(); await refreshDiary();}

document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active"); $("#"+btn.dataset.tab).classList.add("active");
}));

$("#addFoodBtn").onclick=()=>{
  els.foodDialogTitle.textContent="New food"; els.foodForm.reset(); els.foodId.value=""; els.foodBaseAmount.value=100; els.foodDialog.showModal();
};
els.foodForm.addEventListener("submit",async e=>{
  if(e.submitter?.value!=="save") return;
  const payload={user_id:session.user.id,name:els.foodName.value.trim(),calories:Number(els.foodCalories.value),base_amount:Number(els.foodBaseAmount.value),unit:els.foodUnit.value,serving_description:els.foodServing.value.trim()||null};
  let res;
  if(els.foodId.value) res=await client.from("foods").update(payload).eq("id",els.foodId.value);
  else res=await client.from("foods").insert(payload);
  if(res.error){e.preventDefault();return alert(res.error.message);}
  await refreshCoreData();
});
els.foodSearch.addEventListener("input",renderFoods);
els.foodList.addEventListener("click",async e=>{
  const b=e.target.closest("button"); if(!b)return; const f=foods.find(x=>x.id===b.dataset.id); if(!f)return;
  if(b.dataset.action==="edit-food"){els.foodDialogTitle.textContent="Edit food";els.foodId.value=f.id;els.foodName.value=f.name;els.foodCalories.value=f.calories;els.foodBaseAmount.value=f.base_amount;els.foodUnit.value=f.unit;els.foodServing.value=f.serving_description||"";els.foodDialog.showModal();}
  if(b.dataset.action==="delete-food" && confirm(`Delete ${f.name}?`)){const {error}=await client.from("foods").delete().eq("id",f.id);if(error)return alert(error.message);await refreshCoreData();}
});

function ingredientRow(foodId="",amount=100){
  const div=document.createElement("div");div.className="ingredient-row";
  div.innerHTML=`<label>Food<select class="ingredient-food">${foods.map(f=>`<option value="${f.id}" ${f.id===foodId?"selected":""}>${escapeHtml(f.name)} (${f.unit})</option>`).join("")}</select></label>
    <label>Amount<input class="ingredient-amount" type="number" min="0.01" step="0.01" value="${amount}"></label>
    <button type="button" class="small-btn remove-ingredient">✕</button>`;
  div.querySelectorAll("select,input").forEach(x=>x.addEventListener("input",updateRecipeTotals));
  div.querySelector(".remove-ingredient").onclick=()=>{div.remove();updateRecipeTotals();};
  return div;
}
function updateRecipeTotals(){
  let total=0;
  [...els.ingredientRows.querySelectorAll(".ingredient-row")].forEach(row=>{
    const f=foods.find(x=>x.id===row.querySelector(".ingredient-food").value);
    const amt=Number(row.querySelector(".ingredient-amount").value)||0;
    if(f) total+=Number(f.calories)*(amt/Number(f.base_amount));
  });
  const servings=Number(els.recipeServings.value)||1;
  els.recipeTotalCalories.textContent=fmt(total);els.recipePerServing.textContent=fmt(total/servings);
}
$("#addIngredientRowBtn").onclick=()=>{if(!foods.length)return alert("Add some foods first.");els.ingredientRows.appendChild(ingredientRow(foods[0].id,100));updateRecipeTotals();}
els.recipeServings.addEventListener("input",updateRecipeTotals);
$("#addRecipeBtn").onclick=()=>{
  if(!foods.length)return alert("Add at least one food before creating a recipe.");
  els.recipeDialogTitle.textContent="New recipe";els.recipeForm.reset();els.recipeId.value="";els.recipeServings.value=1;els.ingredientRows.innerHTML="";els.ingredientRows.appendChild(ingredientRow(foods[0].id,100));updateRecipeTotals();els.recipeDialog.showModal();
};
els.recipeList.addEventListener("click",async e=>{
  const b=e.target.closest("button");if(!b)return;const r=recipes.find(x=>x.id===b.dataset.id);if(!r)return;
  if(b.dataset.action==="edit-recipe"){els.recipeDialogTitle.textContent="Edit recipe";els.recipeId.value=r.id;els.recipeName.value=r.name;els.recipeServings.value=r.servings;els.ingredientRows.innerHTML="";recipeItems.filter(x=>x.recipe_id===r.id).forEach(it=>els.ingredientRows.appendChild(ingredientRow(it.food_id,it.amount)));updateRecipeTotals();els.recipeDialog.showModal();}
  if(b.dataset.action==="delete-recipe" && confirm(`Delete ${r.name}?`)){const {error}=await client.from("recipes").delete().eq("id",r.id);if(error)return alert(error.message);await refreshCoreData();}
});
els.recipeForm.addEventListener("submit",async e=>{
  if(e.submitter?.value!=="save")return;
  e.preventDefault();
  const name=els.recipeName.value.trim(), servings=Number(els.recipeServings.value);
  let rid=els.recipeId.value;
  if(rid){
    const {error}=await client.from("recipes").update({name,servings}).eq("id",rid);if(error)return alert(error.message);
    const del=await client.from("recipe_items").delete().eq("recipe_id",rid);if(del.error)return alert(del.error.message);
  }else{
    const ins=await client.from("recipes").insert({user_id:session.user.id,name,servings}).select().single();if(ins.error)return alert(ins.error.message);rid=ins.data.id;
  }
  const rows=[...els.ingredientRows.querySelectorAll(".ingredient-row")].map(row=>({user_id:session.user.id,recipe_id:rid,food_id:row.querySelector(".ingredient-food").value,amount:Number(row.querySelector(".ingredient-amount").value)}));
  if(rows.length){const insItems=await client.from("recipe_items").insert(rows);if(insItems.error)return alert(insItems.error.message);}
  els.recipeDialog.close();await refreshCoreData();
});

function buildDiaryOptions(){
  const opts=[
    ...foods.map(f=>({kind:"food",id:f.id,name:f.name,calories:Number(f.calories),baseAmount:Number(f.base_amount),unit:f.unit})),
    ...recipes.map(r=>({kind:"recipe",id:r.id,name:r.name,calories:recipeCalories(r.id)/Number(r.servings||1),baseAmount:1,unit:"serving"}))
  ].sort((a,b)=>a.name.localeCompare(b.name));
  els.diaryItemSelect.innerHTML=opts.map(o=>`<option value="${o.kind}:${o.id}" data-calories="${o.calories}" data-base="${o.baseAmount}" data-unit="${o.unit}">${escapeHtml(o.name)} — ${fmt(o.calories)} kcal per ${o.baseAmount} ${o.unit}</option>`).join("");
  updateDiaryCalc();
}
function updateDiaryCalc(){
  const opt=els.diaryItemSelect.selectedOptions[0];if(!opt)return;
  const qty=Number(els.diaryQuantity.value)||0, calories=Number(opt.dataset.calories)||0, base=Number(opt.dataset.base)||1, unit=opt.dataset.unit;
  els.diaryCalculatedCalories.textContent=fmt(calories*(qty/base));els.diaryUnitHint.textContent=`Enter quantity in ${unit}.`;
}
$("#addDiaryBtn").onclick=()=>{buildDiaryOptions();if(!els.diaryItemSelect.options.length)return alert("Add a food or recipe first.");els.diaryQuantity.value=1;updateDiaryCalc();els.addDiaryDialog.showModal();}
els.diaryItemSelect.addEventListener("change",()=>{const opt=els.diaryItemSelect.selectedOptions[0];els.diaryQuantity.value=opt?.dataset.unit==="g"||opt?.dataset.unit==="ml" ? opt.dataset.base : 1;updateDiaryCalc();});
els.diaryQuantity.addEventListener("input",updateDiaryCalc);
$("#addDiaryForm").addEventListener("submit",async e=>{
  if(e.submitter?.value!=="add")return;e.preventDefault();
  const [kind,id]=els.diaryItemSelect.value.split(":");const qty=Number(els.diaryQuantity.value);let name,calories,label;
  if(kind==="food"){const f=foods.find(x=>x.id===id);name=f.name;calories=Number(f.calories)*(qty/Number(f.base_amount));label=`${qty} ${f.unit}`;}
  else{const r=recipes.find(x=>x.id===id);name=r.name;calories=(recipeCalories(r.id)/Number(r.servings||1))*qty;label=`${qty} serving${qty===1?"":"s"}`;}
  const {error}=await client.from("diary_entries").insert({user_id:session.user.id,entry_date:localDateKey(selectedDate),meal_type:els.diaryMeal.value,item_type:kind,item_ref_id:id,item_name:name,quantity:qty,quantity_label:label,calories});
  if(error)return alert(error.message);els.addDiaryDialog.close();await refreshDiary();
});
els.mealSections.addEventListener("click",async e=>{
  const b=e.target.closest("button");if(!b||b.dataset.action!=="remove-diary")return;
  const {error}=await client.from("diary_entries").delete().eq("id",b.dataset.id);if(error)return alert(error.message);await refreshDiary();
});

init().catch(err=>{console.error(err);alert(err.message);});
