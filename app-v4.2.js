
const cfg=window.APP_CONFIG||{};
const client=supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY);
let session=null,selectedDate=new Date(),profile={daily_calorie_target:2000},foods=[],recipes=[],recipeItems=[],diary=[],weights=[];
const $=s=>document.querySelector(s),fmt=n=>Math.round(Number(n)||0),dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const esc=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const E={authView:$("#authView"),appView:$("#appView"),authForm:$("#authForm"),authEmail:$("#authEmail"),authPassword:$("#authPassword"),authMessage:$("#authMessage"),
selectedDateLabel:$("#selectedDateLabel"),caloriesLeft:$("#caloriesLeft"),targetCalories:$("#targetCalories"),eatenCalories:$("#eatenCalories"),progressBar:$("#progressBar"),
mealSections:$("#mealSections"),foodList:$("#foodList"),foodSearch:$("#foodSearch"),foodCategoryFilter:$("#foodCategoryFilter"),recipeList:$("#recipeList"),recipeSearch:$("#recipeSearch"),recipeLabelFilter:$("#recipeLabelFilter"),
accountDialog:$("#accountDialog"),accountEmail:$("#accountEmail"),targetInput:$("#targetInput"),foodDialog:$("#foodDialog"),foodForm:$("#foodForm"),foodId:$("#foodId"),
foodName:$("#foodName"),foodCategory:$("#foodCategory"),foodEntryType:$("#foodEntryType"),foodCalories:$("#foodCalories"),foodBaseAmount:$("#foodBaseAmount"),foodUnit:$("#foodUnit"),foodServing:$("#foodServing"),foodFavourite:$("#foodFavourite"),
recipeDialog:$("#recipeDialog"),recipeForm:$("#recipeForm"),recipeId:$("#recipeId"),recipeName:$("#recipeName"),recipeServings:$("#recipeServings"),recipeImportedCalories:$("#recipeImportedCalories"),recipeCategories:$("#recipeCategories"),recipeSourceUrl:$("#recipeSourceUrl"),recipeInstructions:$("#recipeInstructions"),
ingredientRows:$("#ingredientRows"),recipeTotalCalories:$("#recipeTotalCalories"),recipePerServing:$("#recipePerServing"),addDiaryDialog:$("#addDiaryDialog"),diaryEditId:$("#diaryEditId"),
diaryMeal:$("#diaryMeal"),diaryItemTypeFilter:$("#diaryItemTypeFilter"),diaryCategoryFilter:$("#diaryCategoryFilter"),diaryCategoryFilterLabel:$("#diaryCategoryFilterLabel"),diaryRecipeLabelFilter:$("#diaryRecipeLabelFilter"),diaryRecipeLabelFilterLabel:$("#diaryRecipeLabelFilterLabel"),diaryItemSelect:$("#diaryItemSelect"),diaryQuantity:$("#diaryQuantity"),diaryUnitHint:$("#diaryUnitHint"),diaryCalculatedCalories:$("#diaryCalculatedCalories"),
weightDialog:$("#weightDialog"),weightDate:$("#weightDate"),weightKg:$("#weightKg"),weightList:$("#weightList"),weightSummary:$("#weightSummary"),recipeImportFile:$("#recipeImportFile"),importDialog:$("#importDialog"),importSummary:$("#importSummary")};

async function init(){const {data:{session:s}}=await client.auth.getSession();session=s;client.auth.onAuthStateChange(async(_,s2)=>{session=s2;await handleSession()});await handleSession()}
async function handleSession(){const yes=!!session?.user;E.authView.hidden=yes;E.appView.hidden=!yes;if(!yes)return;E.accountEmail.textContent=session.user.email||"";await ensureProfile();await refreshCore();await refreshDiary();await refreshWeights()}
async function ensureProfile(){let {data,error}=await client.from("profiles").select("*").eq("user_id",session.user.id).maybeSingle();if(error)throw error;if(!data){const r=await client.from("profiles").insert({user_id:session.user.id}).select().single();if(r.error)throw r.error;data=r.data}profile=data}
async function refreshCore(){const [f,r,i]=await Promise.all([client.from("foods").select("*"),client.from("recipes").select("*"),client.from("recipe_items").select("*")]);if(f.error||r.error||i.error)throw(f.error||r.error||i.error);foods=f.data||[];recipes=r.data||[];recipeItems=i.data||[];renderCategories();renderRecipeLabels();renderFoods();renderRecipes();renderSummary()}
async function refreshDiary(){const r=await client.from("diary_entries").select("*").eq("user_id",session.user.id).eq("entry_date",dateKey(selectedDate)).order("created_at");if(r.error)throw r.error;diary=r.data||[];renderDiary();renderSummary();renderDate()}
async function refreshWeights(){const r=await client.from("weight_entries").select("*").eq("user_id",session.user.id).order("entry_date",{ascending:false});if(r.error)throw r.error;weights=r.data||[];renderWeights()}

function renderDate(){E.selectedDateLabel.textContent=new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"long",year:"numeric"}).format(selectedDate)}
function renderSummary(){const eaten=diary.reduce((s,x)=>s+Number(x.calories),0),target=Number(profile.daily_calorie_target||2000);E.targetCalories.textContent=fmt(target);E.eatenCalories.textContent=fmt(eaten);E.caloriesLeft.textContent=fmt(target-eaten);E.progressBar.style.width=`${Math.max(0,Math.min(100,target?eaten/target*100:0))}%`}
function renderDiary(){const meals=["Breakfast","Lunch","Dinner","Snacks"];E.mealSections.innerHTML=meals.map(m=>{const rows=diary.filter(x=>x.meal_type===m),total=rows.reduce((s,x)=>s+Number(x.calories),0);return `<section class="meal-section"><div class="meal-heading"><h3>${m}</h3><span>${fmt(total)} kcal</span></div><div class="meal-card">${rows.length?rows.map(x=>`<div class="diary-row"><div><div class="name">${esc(x.item_name)}</div><div class="meta">${esc(x.quantity_label||"")}</div></div><div class="calories">${fmt(x.calories)} kcal</div><div><button class="small-btn" data-action="edit-diary" data-id="${x.id}">Edit</button><button class="remove-btn" data-action="remove-diary" data-id="${x.id}">✕</button></div></div>`).join(""):`<div class="empty">Nothing added.</div>`}</div></section>`}).join("")}
function renderCategories(){const cats=[...new Set(foods.map(f=>f.category||"Other"))].sort();const cur=E.foodCategoryFilter.value;E.foodCategoryFilter.innerHTML=`<option value="">All categories</option>`+cats.map(c=>`<option ${c===cur?"selected":""}>${esc(c)}</option>`).join("")}
function renderFoods(){
  const q=E.foodSearch.value.toLowerCase(),cat=E.foodCategoryFilter.value;
  const list=foods.filter(f=>(!q||f.name.toLowerCase().includes(q))&&(!cat||f.category===cat)).sort((a,b)=>(Number(b.favourite)-Number(a.favourite))||a.name.localeCompare(b.name));
  E.foodList.innerHTML=list.length?list.map(f=>{
    const known=f.calories!==null&&f.calories!==undefined, own=f.user_id===session.user.id;
    return `<div class="item-card"><div><div class="name">${f.favourite?'<span class="star">★</span> ':''}${esc(f.name)} <span class="badge">${esc(f.category||'Other')}</span>${own?'':'<span class="shared-badge">Shared</span>'}</div><div class="meta">${known?`${fmt(f.calories)} kcal per ${f.base_amount} ${esc(f.unit)}`:'Calories not set'}${f.serving_description?' • '+esc(f.serving_description):''}</div>${own?`<div class="item-actions"><button class="small-btn" data-action="edit-food" data-id="${f.id}">Edit</button><button class="small-btn" data-action="delete-food" data-id="${f.id}">Delete</button></div>`:''}</div><div class="calories">${known?fmt(f.calories)+' kcal':''}</div></div>`
  }).join(''):`<div class="empty">No foods found.</div>`
}
function recipeCalculatedCalories(id){return recipeItems.filter(x=>x.recipe_id===id).reduce((s,it)=>{const f=foods.find(x=>x.id===it.food_id);return (f&&f.calories!==null&&f.calories!==undefined)?s+Number(f.calories)*(Number(it.amount)/Number(f.base_amount)):s},0)}
function recipePerServing(r){const calc=recipeCalculatedCalories(r.id);if(calc>0)return calc/Number(r.servings||1);return Number(r.imported_calories_per_serving||0)}
function allRecipeLabels(){
  return [...new Set(recipes.flatMap(r=>Array.isArray(r.categories)?r.categories:[]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function renderRecipeLabels(){
  const labels=allRecipeLabels();
  const current=E.recipeLabelFilter.value;
  E.recipeLabelFilter.innerHTML=`<option value="">All recipe labels</option>`+
    labels.map(l=>`<option value="${esc(l)}" ${l===current?"selected":""}>${esc(l)}</option>`).join("");
  const diaryCurrent=E.diaryRecipeLabelFilter.value;
  E.diaryRecipeLabelFilter.innerHTML=`<option value="">All recipe labels</option>`+
    labels.map(l=>`<option value="${esc(l)}" ${l===diaryCurrent?"selected":""}>${esc(l)}</option>`).join("");
}
function renderRecipes(){
  const q=(E.recipeSearch.value||'').trim().toLowerCase(), label=E.recipeLabelFilter.value||'';
  const list=recipes.filter(r=>!q||r.name.toLowerCase().includes(q)).filter(r=>!label||(Array.isArray(r.categories)&&r.categories.includes(label))).slice().sort((a,b)=>a.name.localeCompare(b.name));
  E.recipeList.innerHTML=list.length?list.map(r=>{
    const per=recipePerServing(r), own=r.user_id===session.user.id;
    const labels=(r.categories||[]).map(x=>`<span class="badge">${esc(x)}</span>`).join(' ');
    return `<div class="item-card"><div><div class="name">${esc(r.name)}${own?'':' <span class="shared-badge">Shared</span>'}</div><div class="meta">${r.servings} servings ${labels}</div>${own?`<div class="item-actions"><button class="small-btn" data-action="edit-recipe" data-id="${r.id}">${per?'Edit':'Set calories'}</button><button class="small-btn" data-action="delete-recipe" data-id="${r.id}">Delete</button></div>`:''}</div><div class="calories">${per?fmt(per)+' kcal/serving':'Calories not set'}</div></div>`
  }).join(''):`<div class="empty">No recipes match this filter.</div>`
}
function renderWeights(){E.weightSummary.textContent=weights.length?`Latest: ${weights[0].weight_kg} kg on ${weights[0].entry_date}`:"No weights recorded.";E.weightList.innerHTML=weights.length?weights.map(w=>`<div class="item-card"><div class="name">${w.entry_date}</div><div class="calories">${w.weight_kg} kg <button class="small-btn" data-action="delete-weight" data-id="${w.id}">Delete</button></div></div>`).join(""):""}

E.authForm.onsubmit=async e=>{e.preventDefault();const r=await client.auth.signInWithPassword({email:E.authEmail.value.trim(),password:E.authPassword.value});E.authMessage.textContent=r.error?r.error.message:""}
$("#signUpBtn").onclick=async()=>{const r=await client.auth.signUp({email:E.authEmail.value.trim(),password:E.authPassword.value});E.authMessage.textContent=r.error?r.error.message:"Account created."}
$("#signOutBtn").onclick=async()=>{E.accountDialog.close();await client.auth.signOut()}
$("#accountBtn").onclick=()=>{if(!session)return;E.targetInput.value=profile.daily_calorie_target;E.accountDialog.showModal()}
$("#saveTargetBtn").onclick=async e=>{e.preventDefault();const v=Number(E.targetInput.value),r=await client.from("profiles").update({daily_calorie_target:v}).eq("user_id",session.user.id);if(r.error)return alert(r.error.message);profile.daily_calorie_target=v;renderSummary();E.accountDialog.close()}
$("#prevDayBtn").onclick=async()=>{selectedDate.setDate(selectedDate.getDate()-1);await refreshDiary()}
$("#nextDayBtn").onclick=async()=>{selectedDate.setDate(selectedDate.getDate()+1);await refreshDiary()}
$("#todayBtn").onclick=async()=>{selectedDate=new Date();await refreshDiary()}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.tab).classList.add("active")})

E.foodEntryType.onchange=()=>{if(E.foodEntryType.value==="per100"){E.foodBaseAmount.value=100;if(!["g","ml"].includes(E.foodUnit.value))E.foodUnit.value="g"}else{E.foodBaseAmount.value=1;if(["g","ml"].includes(E.foodUnit.value))E.foodUnit.value="item"}}
$("#addFoodBtn").onclick=()=>{E.foodForm.reset();E.foodId.value="";E.foodBaseAmount.value=100;E.foodDialog.showModal()}
$("#cancelFoodBtn").onclick=()=>E.foodDialog.close("cancel")
E.foodForm.onsubmit=async e=>{if(e.submitter?.value!=="save")return;const p={user_id:session.user.id,name:E.foodName.value.trim(),category:E.foodCategory.value,favourite:E.foodFavourite.checked,calories:E.foodCalories.value===""?null:Number(E.foodCalories.value),base_amount:Number(E.foodBaseAmount.value),unit:E.foodUnit.value,serving_description:E.foodServing.value||null};const r=E.foodId.value?await client.from("foods").update(p).eq("id",E.foodId.value):await client.from("foods").insert(p);if(r.error){e.preventDefault();return alert(r.error.message)}await refreshCore()}
E.foodSearch.oninput=renderFoods;E.foodCategoryFilter.onchange=renderFoods;
E.recipeSearch.oninput=renderRecipes;E.recipeLabelFilter.onchange=renderRecipes
E.foodList.onclick=async e=>{const b=e.target.closest("button");if(!b)return;const f=foods.find(x=>x.id===b.dataset.id);if(!f)return;if(b.dataset.action==="edit-food"){E.foodId.value=f.id;E.foodName.value=f.name;E.foodCategory.value=f.category||"Other";E.foodFavourite.checked=f.favourite;E.foodCalories.value=f.calories??"";E.foodBaseAmount.value=f.base_amount;E.foodUnit.value=f.unit;E.foodServing.value=f.serving_description||"";E.foodEntryType.value=(Number(f.base_amount)===100&&["g","ml"].includes(f.unit))?"per100":"perunit";E.foodDialog.showModal()}if(b.dataset.action==="delete-food"&&confirm(`Delete ${f.name}?`)){const r=await client.from("foods").delete().eq("id",f.id);if(r.error)return alert(r.error.message);await refreshCore()}}

function ingredientRow(foodId="",amount=1,raw=""){const d=document.createElement("div");d.className="ingredient-row";d.dataset.raw=raw;d.innerHTML=`<label>Food<select class="ingredient-food"><option value="">Unmatched / text only</option>${foods.map(f=>`<option value="${f.id}" ${f.id===foodId?"selected":""}>${esc(f.name)} (${f.unit})</option>`).join("")}</select></label><label>Amount<input class="ingredient-amount" type="number" min="0.01" step="0.01" value="${amount}"></label><button type="button" class="small-btn">✕</button>${raw?`<div class="raw-ing">${esc(raw)}</div>`:""}`;d.querySelectorAll("select,input").forEach(x=>x.oninput=updateRecipeTotals);d.querySelector("button").onclick=()=>{d.remove();updateRecipeTotals()};return d}
function updateRecipeTotals(){let t=0;[...E.ingredientRows.querySelectorAll(".ingredient-row")].forEach(row=>{const f=foods.find(x=>x.id===row.querySelector(".ingredient-food").value);if(f)t+=Number(f.calories)*(Number(row.querySelector(".ingredient-amount").value)/Number(f.base_amount))});E.recipeTotalCalories.textContent=fmt(t);E.recipePerServing.textContent=t?fmt(t/(Number(E.recipeServings.value)||1)):fmt(Number(E.recipeImportedCalories.value||0))}
$("#addIngredientRowBtn").onclick=()=>{E.ingredientRows.appendChild(ingredientRow(foods[0]?.id||"",foods[0]?.base_amount||1));updateRecipeTotals()}
$("#addRecipeBtn").onclick=()=>{E.recipeForm.reset();E.recipeId.value="";E.recipeServings.value=1;E.ingredientRows.innerHTML="";updateRecipeTotals();E.recipeDialog.showModal()}
$("#cancelRecipeBtn").onclick=()=>E.recipeDialog.close("cancel")
E.recipeServings.oninput=updateRecipeTotals;E.recipeImportedCalories.oninput=updateRecipeTotals
E.recipeList.onclick=async e=>{const b=e.target.closest("button");if(!b)return;const r=recipes.find(x=>x.id===b.dataset.id);if(!r)return;if(b.dataset.action==="edit-recipe"){E.recipeId.value=r.id;E.recipeName.value=r.name;E.recipeServings.value=r.servings;E.recipeImportedCalories.value=r.imported_calories_per_serving||"";E.recipeCategories.value=(r.categories||[]).join(", ");E.recipeSourceUrl.value=r.source_url||"";E.recipeInstructions.value=r.instructions||"";E.ingredientRows.innerHTML="";recipeItems.filter(x=>x.recipe_id===r.id).forEach(it=>E.ingredientRows.appendChild(ingredientRow(it.food_id||"",it.amount,it.raw_text||"")));updateRecipeTotals();E.recipeDialog.showModal()}if(b.dataset.action==="delete-recipe"&&confirm(`Delete ${r.name}?`)){const x=await client.from("recipes").delete().eq("id",r.id);if(x.error)return alert(x.error.message);await refreshCore()}}
E.recipeForm.onsubmit=async e=>{if(e.submitter?.value!=="save")return;e.preventDefault();let rid=E.recipeId.value;const p={user_id:session.user.id,name:E.recipeName.value.trim(),servings:Number(E.recipeServings.value),imported_calories_per_serving:E.recipeImportedCalories.value?Number(E.recipeImportedCalories.value):null,categories:E.recipeCategories.value.split(",").map(x=>x.trim()).filter(Boolean),source_url:E.recipeSourceUrl.value||null,instructions:E.recipeInstructions.value||null};if(rid){let r=await client.from("recipes").update(p).eq("id",rid);if(r.error)return alert(r.error.message);r=await client.from("recipe_items").delete().eq("recipe_id",rid);if(r.error)return alert(r.error.message)}else{const r=await client.from("recipes").insert(p).select().single();if(r.error)return alert(r.error.message);rid=r.data.id}const rows=[...E.ingredientRows.querySelectorAll(".ingredient-row")].map(row=>({user_id:session.user.id,recipe_id:rid,food_id:row.querySelector(".ingredient-food").value||null,amount:Number(row.querySelector(".ingredient-amount").value),raw_text:row.dataset.raw||null}));if(rows.length){const r=await client.from("recipe_items").insert(rows);if(r.error)return alert(r.error.message)}E.recipeDialog.close();await refreshCore()}

function populateDiaryCategoryFilter(){
  const current=E.diaryCategoryFilter.value;
  const cats=[...new Set(foods.map(f=>f.category||"Other"))].sort();
  E.diaryCategoryFilter.innerHTML=`<option value="">All food categories</option>`+
    cats.map(c=>`<option value="${esc(c)}" ${c===current?"selected":""}>${esc(c)}</option>`).join("");
}
function populateDiaryRecipeLabelFilter(){
  const current=E.diaryRecipeLabelFilter.value;
  const labels=allRecipeLabels();
  E.diaryRecipeLabelFilter.innerHTML=`<option value="">All recipe labels</option>`+
    labels.map(l=>`<option value="${esc(l)}" ${l===current?"selected":""}>${esc(l)}</option>`).join("");
}
function diaryOptions(){
  populateDiaryCategoryFilter();
  populateDiaryRecipeLabelFilter();

  const typeFilter=E.diaryItemTypeFilter.value||"food";
  const foodCategory=E.diaryCategoryFilter.value||"";
  const recipeLabel=E.diaryRecipeLabelFilter.value||"";

  const recent=[...foods].sort((a,b)=>new Date(b.last_used_at||0)-new Date(a.last_used_at||0));

  const foodOpts=recent
    .filter(f=>f.calories!==null&&f.calories!==undefined)
    .filter(f=>!foodCategory||(f.category||"Other")===foodCategory)
    .map(f=>({kind:"food",id:f.id,name:f.name,cal:Number(f.calories),base:Number(f.base_amount),unit:f.unit}));

  const recipeOpts=recipes
    .filter(r=>!recipeLabel||(Array.isArray(r.categories)&&r.categories.includes(recipeLabel)))
    .map(r=>({kind:"recipe",id:r.id,name:r.name,cal:recipePerServing(r),base:1,unit:"serving"}))
    .filter(x=>x.cal>0)
    .sort((a,b)=>a.name.localeCompare(b.name));

  let opts=[];
  if(typeFilter==="recipe") opts=recipeOpts;
  else if(typeFilter==="all") opts=[...foodOpts,...recipeOpts];
  else opts=foodOpts;

  E.diaryCategoryFilterLabel.style.display=typeFilter==="recipe"?"none":"block";
  E.diaryRecipeLabelFilterLabel.style.display=typeFilter==="food"?"none":"block";

  E.diaryItemSelect.innerHTML=opts.length
    ? opts.map(o=>`<option value="${o.kind}:${o.id}" data-cal="${o.cal}" data-base="${o.base}" data-unit="${o.unit}">${esc(o.name)} — ${fmt(o.cal)} kcal</option>`).join("")
    : `<option value="">No matching items with calorie data</option>`;

  E.diaryItemSelect.disabled=!opts.length;
  updateDiaryCalc();
}
function updateDiaryCalc(){
  const o=E.diaryItemSelect.selectedOptions[0];
  if(!o||!o.value){
    E.diaryCalculatedCalories.textContent="0";
    E.diaryUnitHint.textContent="";
    return;
  }
  const q=Number(E.diaryQuantity.value)||0;
  E.diaryCalculatedCalories.textContent=fmt(Number(o.dataset.cal)*(q/Number(o.dataset.base)));
  E.diaryUnitHint.textContent=`Enter quantity in ${o.dataset.unit}.`;
}
$("#addDiaryBtn").onclick=()=>{E.diaryEditId.value="";$("#diaryDialogTitle").textContent="Add to diary";E.diaryItemTypeFilter.value="food";E.diaryCategoryFilter.value="";E.diaryRecipeLabelFilter.value="";diaryOptions();E.diaryQuantity.value=1;updateDiaryCalc();E.addDiaryDialog.showModal()}
E.diaryItemTypeFilter.onchange=()=>{diaryOptions();E.diaryQuantity.value=1;updateDiaryCalc()};
E.diaryCategoryFilter.onchange=()=>{diaryOptions();E.diaryQuantity.value=1;updateDiaryCalc()};
E.diaryRecipeLabelFilter.onchange=()=>{diaryOptions();E.diaryQuantity.value=1;updateDiaryCalc()};
E.diaryItemSelect.onchange=()=>{const o=E.diaryItemSelect.selectedOptions[0];E.diaryQuantity.value=["g","ml"].includes(o?.dataset.unit)?o.dataset.base:1;updateDiaryCalc()};E.diaryQuantity.oninput=updateDiaryCalc
$("#addDiaryForm").onsubmit=async e=>{if(e.submitter?.value!=="add")return;e.preventDefault();const [kind,id]=E.diaryItemSelect.value.split(":"),q=Number(E.diaryQuantity.value);let name,cal,label;if(kind==="food"){const f=foods.find(x=>x.id===id);name=f.name;cal=Number(f.calories)*(q/Number(f.base_amount));label=`${q} ${f.unit}`;await client.from("foods").update({last_used_at:new Date().toISOString()}).eq("id",f.id)}else{const r=recipes.find(x=>x.id===id);name=r.name;cal=recipePerServing(r)*q;label=`${q} serving${q===1?"":"s"}`}const p={user_id:session.user.id,entry_date:dateKey(selectedDate),meal_type:E.diaryMeal.value,item_type:kind,item_ref_id:id,item_name:name,quantity:q,quantity_label:label,calories:cal};const r=E.diaryEditId.value?await client.from("diary_entries").update(p).eq("id",E.diaryEditId.value):await client.from("diary_entries").insert(p);if(r.error)return alert(r.error.message);E.addDiaryDialog.close();await refreshCore();await refreshDiary()}
E.mealSections.onclick=async e=>{const b=e.target.closest("button");if(!b)return;const x=diary.find(d=>d.id===b.dataset.id);if(b.dataset.action==="remove-diary"){const r=await client.from("diary_entries").delete().eq("id",b.dataset.id);if(r.error)return alert(r.error.message);await refreshDiary()}if(b.dataset.action==="edit-diary"&&x){E.diaryEditId.value=x.id;$("#diaryDialogTitle").textContent="Edit diary entry";diaryOptions();E.diaryMeal.value=x.meal_type;E.diaryItemSelect.value=`${x.item_type}:${x.item_ref_id}`;E.diaryQuantity.value=x.quantity;updateDiaryCalc();E.addDiaryDialog.showModal()}}
$("#copyPrevDayBtn").onclick=async()=>{const d=new Date(selectedDate);d.setDate(d.getDate()-1);const r=await client.from("diary_entries").select("*").eq("user_id",session.user.id).eq("entry_date",dateKey(d));if(r.error)return alert(r.error.message);if(!r.data.length)return alert("Previous day has no entries.");if(!confirm(`Copy ${r.data.length} entries from the previous day?`))return;const rows=r.data.map(x=>({user_id:session.user.id,entry_date:dateKey(selectedDate),meal_type:x.meal_type,item_type:x.item_type,item_ref_id:x.item_ref_id,item_name:x.item_name,quantity:x.quantity,quantity_label:x.quantity_label,calories:x.calories}));const ins=await client.from("diary_entries").insert(rows);if(ins.error)return alert(ins.error.message);await refreshDiary()}

$("#addWeightBtn").onclick=()=>{E.weightDate.value=dateKey(new Date());E.weightKg.value="";E.weightDialog.showModal()}
$("#cancelWeightBtn").onclick=()=>E.weightDialog.close("cancel")
$("#weightForm").onsubmit=async e=>{if(e.submitter?.value!=="save")return;e.preventDefault();const r=await client.from("weight_entries").upsert({user_id:session.user.id,entry_date:E.weightDate.value,weight_kg:Number(E.weightKg.value)},{onConflict:"user_id,entry_date"});if(r.error)return alert(r.error.message);E.weightDialog.close();await refreshWeights()}
E.weightList.onclick=async e=>{const b=e.target.closest("button");if(!b)return;const r=await client.from("weight_entries").delete().eq("id",b.dataset.id);if(r.error)return alert(r.error.message);await refreshWeights()}


$("#exportDataBtn").onclick=async()=>{const [d,w]=await Promise.all([client.from("diary_entries").select("*").eq("user_id",session.user.id),client.from("weight_entries").select("*").eq("user_id",session.user.id)]);const backup={exportedAt:new Date().toISOString(),profile,foods,recipes,recipeItems,diaryEntries:d.data||[],weightEntries:w.data||[]};const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`calorie-tracker-backup-${dateKey(new Date())}.json`;a.click();URL.revokeObjectURL(a.href)}

function extractCalories(r){
  const texts=[r.description||"",...(r.comment||[]).map(c=>c?.text||"")];
  for(const t of texts){
    let m=String(t).match(/(?:cals?|calories?|kcal)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i);
    if(m)return Number(m[1]);
    m=String(t).match(/(\d+(?:\.\d+)?)\s*(?:kcal|calories)\b/i);
    if(m)return Number(m[1]);
  }
  return null;
}
function parseYield(y){
  const m=String(y||"").match(/(\d+(?:\.\d+)?)/);
  return m?Number(m[1]):1;
}
function instructionText(arr){
  if(!Array.isArray(arr))return String(arr||"");
  return arr.map(x=>typeof x==="string"?x:(x?.text||"")).filter(Boolean).join("\n");
}
function authorNotes(r){
  return (r.comment||[]).filter(c=>c?.name==="Author Notes").map(c=>c.text||"").join("\n").trim();
}
function likelyIngredientAmount(raw, matchedFood){
  if(!matchedFood)return 1;
  const text=String(raw).toLowerCase().replace(/,/g,"");
  let m;
  if(matchedFood.unit==="g" && (m=text.match(/(\d+(?:\.\d+)?)\s*g\b/))) return Number(m[1]);
  if(matchedFood.unit==="ml" && (m=text.match(/(\d+(?:\.\d+)?)\s*ml\b/))) return Number(m[1]);
  return matchedFood.base_amount || 1;
}
function matchFood(raw){
  const n=String(raw).toLowerCase();
  return foods.slice().sort((a,b)=>b.name.length-a.name.length).find(f=>f.name.length>=3 && n.includes(f.name.toLowerCase()))||null;
}


$("#importRecipesBtn").onclick=()=>E.recipeImportFile.click()
E.recipeImportFile.onchange=async()=>{
  const file=E.recipeImportFile.files[0];
  if(!file)return;

  E.importSummary.innerHTML="<p><strong>Reading RecipeSage export…</strong></p>";
  E.importDialog.showModal();

  try{
    const obj=JSON.parse(await file.text());
    const recs=Array.isArray(obj?.recipes)?obj.recipes:[];
    if(!recs.length)throw new Error("No RecipeSage recipes array was found.");

    let imported=0,skipped=0,ingredientCount=0,calorieCount=0;
    const total=recs.filter(r=>r?.["@type"]==="Recipe").length;

    E.importSummary.innerHTML=`<p><strong>Importing ${total} recipes…</strong></p>
      <p id="importProgress">0 of ${total} processed.</p>`;

    for(const r of recs){
      if(r["@type"]!=="Recipe")continue;
      const ext=r.identifier||null;

      if(ext){
        const check=await client.from("recipes")
          .select("id")
          .eq("external_identifier",ext)
          .maybeSingle();
        if(check.error)throw new Error(`Checking "${r.name||"recipe"}": ${check.error.message}`);
        if(check.data){
          skipped++;
          const p=$("#importProgress");
          if(p)p.textContent=`${imported+skipped} of ${total} processed.`;
          continue;
        }
      }

      const importedCals=extractCalories(r);
      if(importedCals!==null)calorieCount++;

      const payload={
        user_id:session.user.id,
        name:r.name||"Imported recipe",
        servings:parseYield(r.recipeYield),
        instructions:instructionText(r.recipeInstructions)||null,
        source_url:r.isBasedOn||null,
        imported_from:"RecipeSage JSON",
        external_identifier:ext,
        categories:(Array.isArray(r.recipeCategory)?r.recipeCategory:[])
          .filter(c=>!/^import on /i.test(c)),
        description:r.description||null,
        author_notes:authorNotes(r)||null,
        imported_calories_per_serving:importedCals,
        image_url:Array.isArray(r.image)?(r.image[0]||null):(r.image||null)
      };

      const ins=await client.from("recipes").insert(payload).select().single();
      if(ins.error)throw new Error(`Importing "${payload.name}": ${ins.error.message}`);

      const rows=(Array.isArray(r.recipeIngredient)?r.recipeIngredient:[])
        .map(raw=>String(raw).trim())
        .filter(Boolean)
        .map(text=>({
          user_id:session.user.id,
          recipe_id:ins.data.id,
          food_id:null,
          amount:1,
          raw_text:text
        }));

      ingredientCount+=rows.length;

      if(rows.length){
        for(let i=0;i<rows.length;i+=100){
          const ir=await client.from("recipe_items").insert(rows.slice(i,i+100));
          if(ir.error)throw new Error(`Ingredients for "${payload.name}": ${ir.error.message}`);
        }
      }

      imported++;
      const p=$("#importProgress");
      if(p)p.textContent=`${imported+skipped} of ${total} processed — ${imported} imported, ${skipped} skipped.`;
    }

    await refreshCore();

    E.importSummary.innerHTML=`<p><strong>Import complete.</strong></p>
      <p><strong>${imported}</strong> recipes imported.</p>
      <p><strong>${skipped}</strong> already-imported recipes skipped.</p>
      <p><strong>${ingredientCount}</strong> ingredient lines preserved as recipe text.</p>
      <p><strong>${calorieCount}</strong> recipes had a calorie-per-serving value detected.</p>
      <p>No food records were created from recipe ingredients.</p>`;
  }catch(err){
    console.error(err);
    E.importSummary.innerHTML=`<p><strong>Import stopped.</strong></p><p>${esc(err.message)}</p>`;
  }finally{
    E.recipeImportFile.value="";
  }
}

init().catch(err=>{console.error(err);alert(err.message)})
