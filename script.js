const CONFIG_API_KEY = '569f7b0503415a8a76b7e8bc42e77aa0';

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("searchBtn").addEventListener("click", searchSettlementAndWarehouses);
    
    document.getElementById("cityName").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') searchSettlementAndWarehouses();
    });
});

async function searchSettlementAndWarehouses() {
    const cityName = document.getElementById("cityName").value.trim();
    
    const loader = document.getElementById("loader");
    const resultsBlock = document.getElementById("resultsBlock");
    const errorAlert = document.getElementById("errorAlert");
    const tableBody = document.getElementById("warehousesTableBody");

    errorAlert.classList.add("d-none");
    resultsBlock.classList.add("d-none");
    tableBody.innerHTML = "";

    if (!CONFIG_API_KEY) {
        showError("Помилка безпеки: API Ключ відсутній у файлі script.js. Будь ласка, додайте його перед запуском.");
        return;
    }

    if (!cityName) {
        showError("Будь ласка, введіть назву міста чи села.");
        return;
    }

    loader.classList.remove("d-none");

    try {
        const apiUrl = "https://api.novaposhta.ua/v2.0/json/";

        const cityRequestData = {
            apiKey: CONFIG_API_KEY,
            modelName: "Address",
            calledMethod: "getCities",
            methodProperties: {
                FindByString: cityName
            }
        };

        const cityResponse = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cityRequestData)
        });

        if (!cityResponse.ok) throw new Error("Не вдалося зв'язатися з сервером Нової Пошти.");

        const cityResult = await cityResponse.json();

        if (!cityResult.success || cityResult.data.length === 0) {
            throw new Error(`Населений пункт "${cityName}" не знайдено в реєстрах Нової Пошти.`);
        }

        const foundCity = cityResult.data[0];
        const cityRef = foundCity.Ref;
        const fullCityName = foundCity.Description;

        const warehouseRequestData = {
            apiKey: CONFIG_API_KEY,
            modelName: "AddressGeneral",
            calledMethod: "getWarehouses",
            methodProperties: {
                CityRef: cityRef
            }
        };

        const warehouseResponse = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(warehouseRequestData)
        });

        if (!warehouseResponse.ok) throw new Error("Помилка при завантаженні списку відділень.");

        const warehouseResult = await warehouseResponse.json();

        if (!warehouseResult.success || warehouseResult.data.length === 0) {
            throw new Error(`Для населеного пункту ${fullCityName} не знайдено жодного відділення.`);
        }

        document.getElementById("resultsTitle").innerText = `Знайдені відділення та поштомати (${fullCityName}):`;
        
        warehouseResult.data.forEach(warehouse => {
            const tr = document.createElement("tr");

            const tdNumber = document.createElement("td");
            tdNumber.className = "text-center";
            tdNumber.innerHTML = `<span class="badge badge-np px-2 py-1">${warehouse.Number}</span>`;

            const tdAddress = document.createElement("td");
            tdAddress.className = "fw-medium text-dark";
            tdAddress.innerText = warehouse.Description;

            const tdWeight = document.createElement("td");
            tdWeight.className = "text-muted";
            tdWeight.innerText = warehouse.WeightAllowance > 0 
                ? `До ${warehouse.WeightAllowance} кг` 
                : "Без обмежень";

            tr.appendChild(tdNumber);
            tr.appendChild(tdAddress);
            tr.appendChild(tdWeight);
            tableBody.appendChild(tr);
        });

        resultsBlock.classList.remove("d-none");

    } catch (error) {
        showError(error.message);
    } finally {
        loader.classList.add("d-none");
    }
}

function showError(message) {
    const errorAlert = document.getElementById("errorAlert");
    errorAlert.innerText = message;
    errorAlert.classList.remove("d-none");
}