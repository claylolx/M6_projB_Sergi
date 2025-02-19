document.addEventListener("DOMContentLoaded", () => {
    const ccaaSelect = document.getElementById("ccaa");
    const provinciaSelect = document.getElementById("provincia");
    const poblacionSelect = document.getElementById("poblacion");
    const form = document.querySelector("form");
    const imageContainer = document.getElementById("image-container");
    const speakButtons = document.querySelectorAll(".speak-btn");
    const tooltip = document.getElementById("tooltip");
    const closeBtn = document.getElementById("close-explanation");
    const explanationDiv = document.getElementById("explanation");
    closeBtn.addEventListener("click", () => {
        explanationDiv.style.opacity = "0";
        setTimeout(() => explanationDiv.style.display = "none", 300);
    });

    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;

    // Comprobar el tema guardado a localStorage
    if (localStorage.getItem("dark-mode") === "enabled") {
        body.classList.add("dark-mode");
        themeToggle.textContent = "Modo Claro☀️";
    }

    themeToggle.addEventListener("click", () => {
        if (body.classList.contains("dark-mode")) {
            body.classList.remove("dark-mode");
            themeToggle.textContent = "Modo Oscuro🌙";
            localStorage.setItem("dark-mode", "disabled");
        } else {
            body.classList.add("dark-mode");
            themeToggle.textContent = "Modo Claro☀️";
            localStorage.setItem("dark-mode", "enabled");
        }
    });

    // Cargar Comunidades Autónomas
    fetch("https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/ccaa.json")
        .then(response => response.json())
        .then(data => {
            data.forEach(ccaa => {
                let option = document.createElement("option");
                option.value = ccaa.code;
                option.textContent = ccaa.label;
                ccaaSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error al cargar las comunidades autónomas:", error));

    // Cargar Provincias al seleccionar una Comunidad Autónoma
    ccaaSelect.addEventListener("change", () => {
        provinciaSelect.innerHTML = `<option value="" disabled selected>Selecciona una opció</option>`;
        poblacionSelect.innerHTML = `<option value="" disabled selected>Selecciona una opció</option>`;

        fetch("https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/provincias.json")
            .then(response => response.json())
            .then(data => {
                const provincias = data.filter(provincia => provincia.parent_code === ccaaSelect.value);
                provincias.forEach(provincia => {
                    let option = document.createElement("option");
                    option.value = provincia.code;
                    option.textContent = provincia.label;
                    provinciaSelect.appendChild(option);
                });
            })
            .catch(error => console.error("Error al cargar las provincias:", error));
    });

    // Cargar Poblaciones al seleccionar una Provincia
    provinciaSelect.addEventListener("change", () => {
        poblacionSelect.innerHTML = `<option value="" disabled selected>Selecciona una opció</option>`;

        fetch("https://raw.githubusercontent.com/frontid/ComunidadesProvinciasPoblaciones/refs/heads/master/poblaciones.json")
            .then(response => response.json())
            .then(data => {
                const poblaciones = data.filter(poblacion => poblacion.parent_code === provinciaSelect.value);
                poblaciones.forEach(poblacion => {
                    let option = document.createElement("option");
                    option.value = poblacion.label;
                    option.textContent = poblacion.label;
                    poblacionSelect.appendChild(option);
                });
            })
            .catch(error => console.error("Error al cargar las poblaciones:", error));
    });

    // Función para hablar usando la API SpeechSynthesis
    function speakText(text) {
        if ('speechSynthesis' in window) {
            let utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "es-ES";
            speechSynthesis.speak(utterance);
        } else {
            alert("Tu navegador no soporta Text-to-Speech.");
        }
    }

    // Event listener per cada botó de veu
    speakButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const selectElement = document.getElementById(targetId);
            const selectedOption = selectElement.options[selectElement.selectedIndex].text;
            
            if (selectedOption !== "Selecciona una opción") {
                speakText(selectedOption);
            } else {
                alert("Selecciona una opción para escucharla.");
            }
        });
    });

    // Mostrar tooltip després de 2 segons
    setTimeout(() => {
        tooltip.style.opacity = "1";
    }, 2000);

    // Manejo del envio del formulario y buscar imágenes en Wikimedia
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        imageContainer.innerHTML = ""; 

        const poblacion = poblacionSelect.value;
        if (!poblacion) {
            imageContainer.innerHTML = "<p style='color: white;'>Por favor, selecciona una población.</p>";
            return;
        }

        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=images&titles=${encodeURIComponent(poblacion)}&gimlimit=10&prop=imageinfo&iiprop=url`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.query && data.query.pages) {
                    Object.values(data.query.pages).forEach(page => {
                        if (page.imageinfo && page.imageinfo.length > 0) {
                            const imgUrl = page.imageinfo[0].url;
                            const imgBox = document.createElement("div");
                            imgBox.className = "image-box";

                            const img = document.createElement("img");
                            img.src = imgUrl;
                            img.alt = poblacion;

                            const caption = document.createElement("div");
                            caption.className = "image-caption";
                            caption.textContent = poblacion;

                            imgBox.appendChild(img);
                            imgBox.appendChild(caption);
                            imageContainer.appendChild(imgBox);
                        }
                    });
                } else {
                    imageContainer.innerHTML = "<p style='color: white;'>No se encontraron imágenes para esta población.</p>";
                }
            })
            .catch(error => {
                console.error("Error al obtener imágenes:", error);
                imageContainer.innerHTML = "<p style='color: white;'>Ocurrió un error al buscar imágenes.</p>";
            });
    });
});
