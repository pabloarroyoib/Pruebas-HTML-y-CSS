// Encapsulamos todo en un IIFE (Immediately Invoked Function Expression) para evitar variables globales
(() => {
    let inflationData = null;
    let inflationMap = null;

    console.log('Iniciando carga de datos...');

    // Cargar los datos de inflación
    fetch('inflation-data.json')
        .then(response => response.json())
        .then(data => {
            console.log('Datos cargados exitosamente');
            inflationData = data.inflationData;
            inflationMap = createInflationMap(inflationData);
            console.log(`Número de entradas de inflación: ${inflationData.length}`);
            populateSelectOptions();
            calculateInflation(); // Calcula inicialmente con los valores por defecto
        })
        .catch(error => {
            console.error('Error al cargar los datos:', error);
            displayError('Error al cargar los datos de inflación. Por favor, recargue la página.');
        });

    // Función para crear un mapa para búsqueda rápida
    function createInflationMap(data) {
        const map = {};
        data.forEach(entry => {
            map[`${entry.year}-${entry.month}`] = entry.inflation;
        });
        return map;
    }

    // Función para poblar las opciones de los selectores
    function populateSelect(select, options, defaultValue) {
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.text;
            select.appendChild(opt);
        });
        select.value = defaultValue;
    }

    // Función para poblar los selectores de año y mes
    function populateSelectOptions() {
        console.log('Poblando opciones de selección...');
        const yearSelects = document.querySelectorAll('select[id$="Year"]');
        const monthSelects = document.querySelectorAll('select[id$="Month"]');

        const years = [...new Set(inflationData.map(item => item.year))].sort((a, b) => a - b);
        const months = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ].map((month, index) => ({ value: index + 1, text: month }));

        console.log(`Años disponibles: ${years.join(', ')}`);

        yearSelects.forEach(select => populateSelect(select, years.map(year => ({ value: year, text: year })), years[years.length - 1]));
        monthSelects.forEach(select => populateSelect(select, months, 12));

        console.log('Opciones de selección pobladas');
    }

    // Función para calcular la inflación acumulada
    function getInflationForPeriod(startDate, endDate) {
        let accumulatedInflation = 1;
        let monthCount = 0;

        for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
            const yearMonth = `${d.getFullYear()}-${d.getMonth() + 1}`;
            const inflation = inflationMap[yearMonth];

            if (inflation !== undefined) {
                accumulatedInflation *= (1 + inflation / 100);
                monthCount++;
            }
        }

        return { accumulatedInflation, monthCount };
    }

    // Función para calcular la inflación y actualizar la UI
    function calculateInflation() {
        console.log('Iniciando cálculo de inflación...');
        const startYear = parseInt(document.getElementById('startYear').value);
        const startMonth = parseInt(document.getElementById('startMonth').value);
        const endYear = parseInt(document.getElementById('endYear').value);
        const endMonth = parseInt(document.getElementById('endMonth').value);
        const startAmount = parseFloat(document.getElementById('startAmount').value) || 0;

        const startDate = new Date(startYear, startMonth - 1);
        const endDate = new Date(endYear, endMonth - 1);

        if (startDate > endDate) {
            displayError('La fecha de inicio debe ser anterior a la fecha final');
            return;
        }

        const { accumulatedInflation, monthCount } = getInflationForPeriod(startDate, new Date(endDate.setMonth(endDate.getMonth() - 1)));

        const endAmount = startAmount * accumulatedInflation;
        const totalInflation = (accumulatedInflation - 1) * 100;
        const averageMonthlyInflation = monthCount > 0 ? Math.pow(accumulatedInflation, 1 / monthCount) - 1 : 0;
        const averageYearlyInflation = Math.pow(1 + averageMonthlyInflation, 12) - 1;

        console.log(`Resultados: endAmount=${endAmount.toFixed(2)}, totalInflation=${totalInflation.toFixed(2)}%, averageMonthlyInflation=${(averageMonthlyInflation * 100).toFixed(2)}%, averageYearlyInflation=${(averageYearlyInflation * 100).toFixed(2)}%`);

        document.getElementById('endAmount').value = endAmount.toFixed(2);
        document.getElementById('accumulatedInflation').textContent = totalInflation.toFixed(2) + '%';
        document.getElementById('averageMonthlyInflation').textContent = (averageMonthlyInflation * 100).toFixed(2) + '%';
        document.getElementById('averageYearlyInflation').textContent = (averageYearlyInflation * 100).toFixed(2) + '%';
    }

    // Función para mostrar errores en la UI
    function displayError(message) {
        console.error('Error:', message);
        document.getElementById('endAmount').value = '';
        document.getElementById('accumulatedInflation').textContent = message;
        document.getElementById('averageMonthlyInflation').textContent = '';
        document.getElementById('averageYearlyInflation').textContent = '';
    }

    // Agregar event listeners para actualizar la inflación al cambiar parámetros
    document.getElementById('startYear').addEventListener('change', calculateInflation);
    document.getElementById('startMonth').addEventListener('change', calculateInflation);
    document.getElementById('endYear').addEventListener('change', calculateInflation);
    document.getElementById('endMonth').addEventListener('change', calculateInflation);
    document.getElementById('startAmount').addEventListener('input', calculateInflation);

    // Calcular inflación cuando se carga la página
    window.addEventListener('load', () => {
        console.log('Página cargada. Iniciando cálculo inicial...');
        calculateInflation();
    });

})();
