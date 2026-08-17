
const STORAGE_KEY = "calorieTrackerDataV1";

const defaultData = {
  target: 2000,
  foods: [
    {id: crypto.randomUUID(), name:"Banana", calories:105, serving:"1 medium"},
    {id: crypto.randomUUID(), name:"Egg", calories:78, serving:"1 large"}
  ],
  recipes: [],
  diary: {}
};

let data = loadData();

function loadData(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(defaultData);
  }catch{
    return structuredClone(defaultData);
  }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmt(n){ return Math.round(Number(n) || 0); }
function escapeHtml(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  caloriesLeft: document.querySelector("#caloriesLeft"),
  targetCalories: document.querySelector("#targetCalories"),
  eatenCalories: document.querySelector("#eatenCalories"),
  progressBar: document.querySelector("#progressBar"),
  diaryList: document.querySelector("#diaryList"),
  foodList: document.querySelector("#foodList"),
  recipeList: document.querySelector("#recipeList"),
  foodSearch: document.querySelector("#foodSearch"),
  settingsDialog: document.querySelector("#settingsDialog"),
  targetInput: document.querySelector("#targetInput"),
  foodDialog: document.querySelector("#foodDialog"),
  foodForm: document.querySelector("#foodForm"),
  foodId: document.querySelector("#foodId"),
  foodName: document.querySelector("#foodName"),
  foodCalories: document.querySelector("#foodCalories"),
  foodServing: document.querySelector("#foodServing"),
  foodDialogTitle: document.querySelector("#foodDialogTitle"),
  recipeDialog: document.querySelector("#recipeDialog"),
  recipeForm: document.querySelector("#recipeForm"),
  recipeId: document.querySelector("#recipeId"),
  recipeName: document.querySelector("#recipeName"),
  recipeCalories: document.querySelector("#recipeCalories"),
  recipeServings: document.querySelector("#recipeServings"),
  recipePerServing: document.querySelector("#recipePerServing"),
  addDiaryDialog: document.querySelector("#addDiaryDialog"),
  diaryItemSelect: document.querySelector("#diaryItemSelect"),
  diaryServings: document.querySelector("#diaryServings"),
  diaryCalculatedCalories: document.querySelector("#diaryCalculatedCalories")
};

function diaryEntries(){
  return data.diary[todayKey()] || [];
}
function eatenToday(){
  return diaryEntries().reduce((sum,x)=>sum + Number(x.calories),0);
}
function renderSummary(){
  const eaten = eatenToday();
  const left = data.target - eaten;
  els.targetCalories.textContent = fmt(data.target);
  els.eatenCalories.textContent = fmt(eaten);
  els.caloriesLeft.textContent = fmt(left);
  els.progressBar.style.width = `${Math.max(0,Math.min(100,(eaten/data.target)*100 || 0))}%`;
}
function renderDiary(){
  const entries = diaryEntries();
  if(!entries.length){
    els.diaryList.innerHTML = `<div class="empty">Nothing logged yet today.</div>`;
    return;
  }
  els.diaryList.innerHTML = entries.map(x=>`
    <div class="item-card">
      <div>
        <div class="name">${escapeHtml(x.name)}</div>
        <div class="meta">${x.servings} serving${x.servings==1?"":"s"}</div>
        <div class="item-actions">
          <button class="small-btn" data-action="remove-diary" data-id="${x.id}">Remove</button>
        </div>
      </div>
      <div class="calories">${fmt(x.calories)} kcal</div>
    </div>`).join("");
}
function renderFoods(){
  const q = els.foodSearch.value.trim().toLowerCase();
  const foods = data.foods.filter(f=>f.name.toLowerCase().includes(q));
  els.foodList.innerHTML = foods.length ? foods.map(f=>`
    <div class="item-card">
      <div>
        <div class="name">${escapeHtml(f.name)}</div>
        <div class="meta">${escapeHtml(f.serving || "1 serving")}</div>
        <div class="item-actions">
          <button class="small-btn" data-action="edit-food" data-id="${f.id}">Edit</button>
          <button class="small-btn" data-action="delete-food" data-id="${f.id}">Delete</button>
        </div>
      </div>
      <div class="calories">${fmt(f.calories)} kcal</div>
    </div>`).join("") : `<div class="empty">No foods found.</div>`;
}
function renderRecipes(){
  els.recipeList.innerHTML = data.recipes.length ? data.recipes.map(r=>`
    <div class="item-card">
      <div>
        <div class="name">${escapeHtml(r.name)}</div>
        <div class="meta">${r.servings} serving${r.servings==1?"":"s"} • ${fmt(r.totalCalories)} kcal total</div>
        <div class="item-actions">
          <button class="small-btn" data-action="edit-recipe" data-id="${r.id}">Edit</button>
          <button class="small-btn" data-action="delete-recipe" data-id="${r.id}">Delete</button>
        </div>
      </div>
      <div class="calories">${fmt(r.totalCalories/r.servings)} kcal/serving</div>
    </div>`).join("") : `<div class="empty">No recipes yet.</div>`;
}
function renderAll(){ renderSummary(); renderDiary(); renderFoods(); renderRecipes(); }

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    document.querySelector(`#${btn.dataset.tab}`).classList.add("active");
  });
});

document.querySelector("#settingsBtn").onclick=()=>{
  els.targetInput.value=data.target;
  els.settingsDialog.showModal();
};
document.querySelector("#settingsForm").addEventListener("submit",e=>{
  if(e.submitter?.value==="save"){
    data.target=Number(els.targetInput.value);
    saveData(); renderAll();
  }
});

document.querySelector("#addFoodBtn").onclick=()=>{
  els.foodDialogTitle.textContent="New food";
  els.foodForm.reset(); els.foodId.value="";
  els.foodDialog.showModal();
};
els.foodForm.addEventListener("submit",e=>{
  if(e.submitter?.value!=="save") return;
  const obj={
    id: els.foodId.value || crypto.randomUUID(),
    name: els.foodName.value.trim(),
    calories:Number(els.foodCalories.value),
    serving:els.foodServing.value.trim()
  };
  const idx=data.foods.findIndex(f=>f.id===obj.id);
  if(idx>=0) data.foods[idx]=obj; else data.foods.push(obj);
  saveData(); renderAll();
});

els.foodSearch.addEventListener("input",renderFoods);
els.foodList.addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  const f=data.foods.find(x=>x.id===b.dataset.id);
  if(b.dataset.action==="edit-food" && f){
    els.foodDialogTitle.textContent="Edit food";
    els.foodId.value=f.id; els.foodName.value=f.name; els.foodCalories.value=f.calories; els.foodServing.value=f.serving||"";
    els.foodDialog.showModal();
  }
  if(b.dataset.action==="delete-food" && f && confirm(`Delete ${f.name}?`)){
    data.foods=data.foods.filter(x=>x.id!==f.id); saveData(); renderAll();
  }
});

function updateRecipePerServing(){
  const total=Number(els.recipeCalories.value)||0, servings=Number(els.recipeServings.value)||1;
  els.recipePerServing.textContent=fmt(total/servings);
}
document.querySelector("#addRecipeBtn").onclick=()=>{
  els.recipeDialogTitle.textContent="New recipe";
  els.recipeForm.reset(); els.recipeId.value=""; els.recipeServings.value=1; updateRecipePerServing();
  els.recipeDialog.showModal();
};
els.recipeCalories.addEventListener("input",updateRecipePerServing);
els.recipeServings.addEventListener("input",updateRecipePerServing);
els.recipeForm.addEventListener("submit",e=>{
  if(e.submitter?.value!=="save") return;
  const obj={
    id:els.recipeId.value||crypto.randomUUID(),
    name:els.recipeName.value.trim(),
    totalCalories:Number(els.recipeCalories.value),
    servings:Number(els.recipeServings.value)
  };
  const idx=data.recipes.findIndex(r=>r.id===obj.id);
  if(idx>=0) data.recipes[idx]=obj; else data.recipes.push(obj);
  saveData(); renderAll();
});
els.recipeList.addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  const r=data.recipes.find(x=>x.id===b.dataset.id);
  if(b.dataset.action==="edit-recipe" && r){
    els.recipeDialogTitle.textContent="Edit recipe";
    els.recipeId.value=r.id; els.recipeName.value=r.name; els.recipeCalories.value=r.totalCalories; els.recipeServings.value=r.servings;
    updateRecipePerServing(); els.recipeDialog.showModal();
  }
  if(b.dataset.action==="delete-recipe" && r && confirm(`Delete ${r.name}?`)){
    data.recipes=data.recipes.filter(x=>x.id!==r.id); saveData(); renderAll();
  }
});

function buildDiaryOptions(){
  const opts=[
    ...data.foods.map(f=>({type:"food",id:f.id,name:f.name,calories:f.calories})),
    ...data.recipes.map(r=>({type:"recipe",id:r.id,name:r.name,calories:r.totalCalories/r.servings}))
  ].sort((a,b)=>a.name.localeCompare(b.name));
  els.diaryItemSelect.innerHTML=opts.map(o=>`<option value="${o.type}:${o.id}" data-calories="${o.calories}">${escapeHtml(o.name)} — ${fmt(o.calories)} kcal</option>`).join("");
  updateDiaryCalc();
}
function updateDiaryCalc(){
  const opt=els.diaryItemSelect.selectedOptions[0];
  const c=Number(opt?.dataset.calories)||0, servings=Number(els.diaryServings.value)||0;
  els.diaryCalculatedCalories.textContent=fmt(c*servings);
}
document.querySelector("#addDiaryBtn").onclick=()=>{
  buildDiaryOptions();
  if(!els.diaryItemSelect.options.length){ alert("Add a food or recipe first."); return; }
  els.diaryServings.value=1; updateDiaryCalc(); els.addDiaryDialog.showModal();
};
els.diaryItemSelect.addEventListener("change",updateDiaryCalc);
els.diaryServings.addEventListener("input",updateDiaryCalc);
document.querySelector("#addDiaryForm").addEventListener("submit",e=>{
  if(e.submitter?.value!=="add") return;
  const [type,id]=els.diaryItemSelect.value.split(":");
  let item, caloriesPerServing;
  if(type==="food"){ item=data.foods.find(x=>x.id===id); caloriesPerServing=item.calories; }
  else { item=data.recipes.find(x=>x.id===id); caloriesPerServing=item.totalCalories/item.servings; }
  const servings=Number(els.diaryServings.value);
  const key=todayKey();
  if(!data.diary[key]) data.diary[key]=[];
  data.diary[key].push({id:crypto.randomUUID(),sourceType:type,sourceId:id,name:item.name,servings,calories:caloriesPerServing*servings});
  saveData(); renderAll();
});
els.diaryList.addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  if(b.dataset.action==="remove-diary"){
    const key=todayKey();
    data.diary[key]=(data.diary[key]||[]).filter(x=>x.id!==b.dataset.id);
    saveData(); renderAll();
  }
});

els.todayLabel.textContent = new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
renderAll();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
}
