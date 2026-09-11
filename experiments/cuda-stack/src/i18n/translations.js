export const languages = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
];

export const translations = {
  en: {
    meta: {
      title: 'CUDA Stack — How an Instruction Gets From CPU to GPU',
      description:
        'An interactive explainer: what CUDA actually does to silicon, and the twelve layers a PyTorch-shaped framework stacks on top of it.',
    },
    nav: {
      back: 'emrecanulu.com',
    },
    hero: {
      title: 'How does a program reach the GPU?',
      lede: "CUDA doesn't turn a graphics card into something else. It opens a door to hardware that was already built for parallel arithmetic — and everything from PyTorch down to a single warp is built on that door.",
      hint: 'Scroll to see it work.',
    },
    act1: {
      title: 'The machine',
      cpuGpu: {
        title: 'Same job, two machines',
        task: 'x[i] = x[i] * 2, for one million values of i',
        cpuLabel: 'Host — CPU',
        gpuLabel: 'Device — GPU',
        cpuDesc: '8 cores. Each one works through its share of the array in turn.',
        gpuDesc: '2,048 threads. Every one touches its own element at the same instant.',
        counterLabel: 'elements processed',
      },
      cudaEntry: {
        title: 'Where CUDA enters',
        oldLabel: 'Without CUDA',
        oldPath: 'Program → OpenGL / DirectX → GPU → Pixels',
        newLabel: 'With CUDA',
        newPath: 'C++ / Python → CUDA → nvcc compiler → PTX → Driver → Streaming Multiprocessors → Result',
        body: "The GPU's arithmetic units were never exclusive to graphics — they were already doing matrix multiplication and vector math to place every pixel. CUDA just gives software a way to ask for that math directly, without going through a graphics API at all.",
      },
      misconception: {
        title: 'CUDA is not a translator',
        body: 'A GPU is programmable hardware, not a graphics-only chip that CUDA secretly converts. CUDA is the access layer sitting on top of hardware that was already capable — a compiler, a runtime, and a set of libraries that let you address that hardware without pretending to draw a triangle.',
        coreNote:
          'A CUDA Core is a physical arithmetic unit inside the GPU. CUDA is the software platform for programming it — and the newer ones, including Tensor Cores built specifically for matrix math.',
        amdTitle: "AMD's equivalent",
        amdBody:
          'ROCm is the platform; HIP is the C++ API that reads almost line-for-line like CUDA. cudaMalloc becomes hipMalloc, cudaMemcpy becomes hipMemcpy. HIPIFY converts most CUDA source automatically — though not always as a true drop-in, and it can need manual tuning.',
      },
    },
    stack: {
      title: 'The stack',
      lede: "A PyTorch-shaped framework isn't a CUDA library — it's a tensor runtime that happens to use CUDA as one backend. Twelve layers, top to bottom.",
      hint: 'Scroll through the layers, or click a node.',
      codeToggle: { show: 'See the code', hide: 'Hide the code' },
      layers: {
        tensor: {
          title: 'Tensor',
          body: "A tensor isn't the data — it's a small metadata object that describes a region of memory: where it starts, its shape, its strides (how far to jump per dimension), its dtype, and which device owns it. Reshaping or transposing a tensor usually just rewrites this metadata; the underlying storage doesn't move.",
          summary: "A pointer with directions attached, not a copy of the numbers.",
        },
        allocator: {
          title: 'Allocator',
          body: "Calling cudaMalloc and cudaFree on every tensor is expensive — GPU allocation isn't free the way stack allocation is. A caching allocator instead keeps freed blocks in a pool by size, so the next tensor of the same size reuses memory instantly instead of asking the driver again.",
          summary: 'Freed memory goes back into a pool, not back to the driver.',
        },
        operator: {
          title: 'Operator',
          body: 'add, matmul, relu, conv2d — every computation a framework offers is registered as an operator with a schema, a contract describing its inputs and output type. The schema is what lets the same call, torch.add(a, b), mean something concrete no matter which backend eventually runs it.',
          summary: 'A named contract, not yet an implementation.',
        },
        dispatcher: {
          title: 'Dispatcher',
          body: "a + b doesn't say where a lives. CPU, an NVIDIA GPU, an AMD GPU — and which dtype: float32, float16, int32. The dispatcher reads the tensor's device and dtype and routes the call to the matching registered implementation, without the caller ever branching on device by hand.",
          summary: 'One call, routed to whichever implementation actually matches.',
        },
        backend: {
          title: 'Backend implementation',
          body: "Once the dispatcher decides CUDA, add_cuda runs on the CPU — it's still host code. Its job is bookkeeping: confirm the tensors are on the right device, allocate the output, work out thread and block counts, and launch the real kernel. The launch itself is asynchronous; this function returns immediately.",
          summary: 'Host-side code whose only job is to prepare and launch the kernel.',
        },
        kernel: {
          title: 'Kernel',
          body: 'This is the code that actually runs on the GPU. A grid of thread blocks is launched; each thread computes its own index from blockIdx and threadIdx and handles one element. Threads execute in groups of 32 called warps, on a Streaming Multiprocessor, following the same instruction in lockstep — a model called SIMT.',
          summary: 'One line of code, executed by thousands of threads at once.',
        },
        vendor: {
          title: 'Vendor libraries',
          body: "You almost never hand-write matrix multiplication in production. cuBLAS, cuDNN, and cuFFT are NVIDIA's own hand-tuned kernels for linear algebra, convolution, and Fourier transforms — years of optimization a framework's backend calls into instead of reinventing.",
          summary: "The heavy math is someone else's already-tuned kernel.",
        },
        runtime: {
          title: 'Execution runtime',
          body: "GPU work is asynchronous by default — launching a kernel doesn't block the CPU. Streams are ordered queues of work: operations in the same stream run in sequence, operations in different streams can overlap. A framework schedules its kernels onto streams and only synchronizes when a result is actually needed on the host.",
          summary: 'The CPU keeps moving while the GPU catches up.',
        },
        autograd: {
          title: 'Autograd',
          body: 'Every forward operation can record itself as a node in a graph, remembering which tensors it depends on. Calling .backward() walks that graph in reverse, applying the chain rule at each node — reverse-mode automatic differentiation. For y = a × b, the multiply node knows ∂y/∂a = b and ∂y/∂b = a, and pushes gradients backward from there.',
          summary: 'The forward pass quietly builds the graph it will later run backward.',
        },
        frontend: {
          title: 'Frontend API',
          body: 'Everything below this line is invisible to most users. A Module bundles Parameters — tensors with requires_grad set — and a forward method into something you can compose: nn.Linear, nn.Conv2d, and eventually your own model. This is the layer people actually write code against.',
          summary: 'Where the stack stops looking like systems code.',
        },
        compiler: {
          title: 'Graph compiler',
          body: 'x + 1, then relu, then × 2 can run as three separate kernels — three round trips to GPU memory. A graph compiler sees the whole sequence, captures it as an intermediate representation, and fuses it into a single kernel that computes all three steps per element without leaving the chip in between.',
          summary: 'Three kernels become one; memory traffic disappears.',
        },
        bindings: {
          title: 'Python bindings',
          body: 'The user-facing API is Python, but the core is C++ and CUDA. A binding layer — commonly pybind11 — exposes native functions to the Python interpreter, so my_tensor_lib.add(a, b) in Python is, underneath, a direct call into compiled C++.',
          summary: "The last hop: from compiled C++ back into the language you're typing.",
        },
      },
    },
    trace: {
      title: 'c = a + b, all the way down',
      lede: 'Every layer above, walked in order, for one real call.',
      phases: { host: 'Host', device: 'Device', return: 'Return' },
      steps: {
        python: 'Python: c = a + b',
        'tensor-api': 'Tensor.__add__() resolves the call',
        operator: 'Routed to the aten::add operator',
        dispatcher: 'Dispatcher reads device=cuda, dtype=float32',
        'cuda-backend': 'add_cuda(a, b) runs on the host',
        allocator: 'Allocator reserves GPU memory for the output',
        'kernel-select': 'The float32 add kernel is selected',
        'kernel-launch': 'add_kernel<<<3907, 256>>>(...) launches',
        'cuda-runtime': 'CUDA Runtime enqueues the kernel on a stream',
        'cuda-driver': 'Driver turns it into GPU commands',
        'gpu-scheduler': 'Scheduler spreads blocks across SMs',
        warps: 'Each SM runs its threads in warps of 32',
        'gpu-memory': 'out[i] = a[i] + b[i] happens in parallel',
        return: 'Result returns as a Tensor — with a grad_fn if requires_grad was set',
      },
      closing:
        "A PyTorch-shaped framework isn't a CUDA library. It's a tensor runtime, an operator system, and an autodiff engine that happens to use CUDA as one backend among several.",
    },
    footer: {
      back: 'Back to emrecanulu.com',
    },
  },
  tr: {
    meta: {
      title: 'CUDA Stack — Bir Talimat CPU’dan GPU’ya Nasıl Ulaşır',
      description:
        'İnteraktif bir anlatı: CUDA silikonda gerçekte ne yapıyor, ve PyTorch benzeri bir framework onun üzerine hangi on iki katmanı kuruyor.',
    },
    nav: {
      back: 'emrecanulu.com',
    },
    hero: {
      title: 'Bir program GPU’ya nasıl ulaşır?',
      lede: 'CUDA bir ekran kartını başka bir şeye dönüştürmüyor. Zaten paralel hesaplama için var olan bir donanığa kapı açıyor — PyTorch’tan tek bir warp’a kadar her şey bu kapının üzerine kurulu.',
      hint: 'Nasıl çalıştığını görmek için kaydır.',
    },
    act1: {
      title: 'Makine',
      cpuGpu: {
        title: 'Aynı iş, iki farklı makine',
        task: 'x[i] = x[i] * 2, bir milyon i değeri için',
        cpuLabel: 'Host — CPU',
        gpuLabel: 'Device — GPU',
        cpuDesc: '8 çekirdek. Her biri dizideki payına sırayla bakar.',
        gpuDesc: '2.048 thread. Her biri kendi elemanına aynı anda dokunur.',
        counterLabel: 'işlenen eleman',
      },
      cudaEntry: {
        title: 'CUDA nereye giriyor',
        oldLabel: 'CUDA olmadan',
        oldPath: 'Program → OpenGL / DirectX → GPU → Piksel',
        newLabel: 'CUDA ile',
        newPath: 'C++ / Python → CUDA → nvcc derleyici → PTX → Sürücü → Streaming Multiprocessor’lar → Sonuç',
        body: 'GPU’nun hesaplama birimleri hiçbir zaman sadece grafiğe özgü değildi — her pikseli yerleştirmek için zaten matris çarpımı ve vektör matematiği yapıyorlardı. CUDA, yazılıma bu matematiği hiçbir grafik API’sinden geçmeden doğrudan isteme yolu açıyor.',
      },
      misconception: {
        title: 'CUDA bir dönüştürücü değil',
        body: 'GPU zaten programlanabilir bir donanım; CUDA’nın gizliden gizliye grafiğe özel bir çipi başka bir şeye çevirdiği bir kurgu değil bu. CUDA, zaten yetenekli olan donanığın üzerindeki erişim katmanı — bir derleyici, bir runtime ve bir üçgen çizermiş gibi yapmadan o donanıma ulaşmanı sağlayan bir kütüphane seti.',
        coreNote:
          'CUDA Core, GPU içindeki fiziksel bir aritmetik birim. CUDA ise onu — ve matris matematiği için özel olarak tasarlanmış Tensor Core gibi daha yenilerini — programlamana yarayan yazılım platformu.',
        amdTitle: 'AMD’deki karşılığı',
        amdBody:
          'ROCm platform; HIP ise CUDA’ya neredeyse satır satır benzeyen C++ API’si. cudaMalloc, hipMalloc oluyor; cudaMemcpy, hipMemcpy. HIPIFY çoğu CUDA kodunu otomatik çeviriyor — ama her zaman birebir yerine geçmiyor, bazen elle ayar gerekiyor.',
      },
    },
    stack: {
      title: 'Yığın',
      lede: 'PyTorch benzeri bir framework bir CUDA kütüphanesi değil — CUDA’yı sadece bir backend olarak kullanan bir tensor runtime’ı. Yukarıdan aşağı on iki katman.',
      hint: 'Katmanlar arasında kaydır, ya da bir düğüme tıkla.',
      codeToggle: { show: 'Kodu gör', hide: 'Kodu gizle' },
      layers: {
        tensor: {
          title: 'Tensor',
          body: 'Tensor verinin kendisi değil — bellekteki bir bölgeyi tarif eden küçük bir metadata nesnesi: nereden başladığı, şekli, stride’ları (her boyutta kaç adım atlanacağı), dtype’ı ve hangi cihaza ait olduğu. Bir tensoru reshape ya da transpose etmek genelde sadece bu metadata’yı değiştirir; alttaki storage yerinden kımıldamaz.',
          summary: 'Sayıların kopyası değil, üzerine yön tarif eklenmiş bir işaretçi.',
        },
        allocator: {
          title: 'Allocator',
          body: 'Her tensor için cudaMalloc ve cudaFree çağırmak pahalı — GPU’da bellek ayırmak stack’te olduğu kadar bedava değil. Caching allocator bunun yerine serbest kalan blokları boyutlarına göre bir havuzda tutar; aynı boyuttaki bir sonraki tensor sürücüye tekrar sormak yerine belleği anında yeniden kullanır.',
          summary: 'Serbest kalan bellek sürücüye değil, havuza geri döner.',
        },
        operator: {
          title: 'Operator',
          body: 'add, matmul, relu, conv2d — bir framework’ün sunduğu her hesaplama bir schema’yla, girdi ve çıktı tipini tarif eden bir kontratla, operator olarak kaydedilir. Schema, aynı çağrının — torch.add(a, b) — hangi backend’in sonunda çalıştıracağından bağımsız olarak somut bir anlam taşımasını sağlar.',
          summary: 'Henüz implementasyon değil, isimlendirilmiş bir kontrat.',
        },
        dispatcher: {
          title: 'Dispatcher',
          body: 'a + b, a’nın nerede yaşadığını söylemiyor. CPU mu, NVIDIA GPU mu, AMD GPU mu — ve hangi dtype: float32, float16, int32. Dispatcher, tensor’un device ve dtype’ına bakıp çağrıyı eşleşen kayıtlı implementasyona yönlendiriyor; çağıran taraf hiçbir zaman elle device kontrolü yapmıyor.',
          summary: 'Tek çağrı, gerçekten eşleşen implementasyona yönlendirilir.',
        },
        backend: {
          title: 'Backend implementasyonu',
          body: 'Dispatcher CUDA’ya karar verdiğinde add_cuda CPU üzerinde çalışır — hâlâ host kodu. İşi muhasebe: tensorların gerçekten doğru cihazda olduğunu kontrol etmek, çıktıyı ayırmak, thread ve block sayısını hesaplamak ve gerçek kernel’i başlatmak. Launch’ın kendisi asenkron; bu fonksiyon hemen geri döner.',
          summary: 'Tek işi kernel’i hazırlayıp başlatmak olan host-side kod.',
        },
        kernel: {
          title: 'Kernel',
          body: 'Bu, GPU üzerinde gerçekten çalışan kod. Bir grid dolusu thread block başlatılır; her thread kendi indeksini blockIdx ve threadIdx’ten hesaplar ve bir elemanı işler. Thread’ler bir Streaming Multiprocessor üzerinde 32’li warp gruplar hâlinde, aynı komutu adım adım birlikte çalıştırır — buna SIMT denir.',
          summary: 'Tek satır kod, binlerce thread tarafından aynı anda çalıştırılır.',
        },
        vendor: {
          title: 'Üretici kütüphaneleri',
          body: 'Production’da matris çarpımını neredeyse hiç elle yazmazsın. cuBLAS, cuDNN ve cuFFT — NVIDIA’nın lineer cebir, convolution ve Fourier dönüşümü için elle optimize edilmiş kendi kernel’leri; bir framework’ün backend’i yeniden icat etmek yerine bunlara çağrı yapar.',
          summary: 'Ağır matematik, başkasının çoktan optimize ettiği kernel.',
        },
        runtime: {
          title: 'Çalışma zamanı',
          body: 'GPU işleri varsayılan olarak asenkron — bir kernel başlatmak CPU’yu bloklamaz. Stream’ler sıralı iş kuyrukları: aynı stream’deki işlemler sırayla çalışır, farklı stream’ler örtüşebilir. Bir framework kernel’lerini stream’lere zamanlar ve sonuca host tarafında gerçekten ihtiyaç duyulduğunda senkronize eder.',
          summary: 'CPU yoluna devam ederken GPU arkadan yetişir.',
        },
        autograd: {
          title: 'Autograd',
          body: 'Her forward işlem, hangi tensorlara bağlı olduğunu hatırlayarak kendini bir graph düğümü olarak kaydedebilir. .backward() çağrısı bu graph’ı tersine yürür, her düğümde zincir kuralını uygular — buna reverse-mode automatic differentiation denir. y = a × b için çarpma düğümü ∂y/∂a = b ve ∂y/∂b = a olduğunu bilir ve gradyanları oradan geriye iter.',
          summary: 'Forward geçiş, daha sonra tersine koşacağı graph’ı sessizce kurar.',
        },
        frontend: {
          title: 'Frontend API',
          body: 'Bu satırın altındaki her şey çoğu kullanıcı için görünmez. Bir Module, Parameter’ları — requires_grad açık tensorları — ve bir forward metodunu birleştirip üzerine inşa edebileceğin bir şeye dönüştürür: nn.Linear, nn.Conv2d ve sonunda kendi modelin. İnsanların gerçekten kod yazdığı katman burası.',
          summary: 'Yığının artık systems kodu gibi görünmediği yer.',
        },
        compiler: {
          title: 'Graph compiler',
          body: 'x + 1, sonra relu, sonra × 2 üç ayrı kernel olarak çalışabilir — GPU belleğine üç ayrı gidiş geliş. Graph compiler tüm diziyi görür, bir intermediate representation olarak yakalar ve üç adımı da eleman başına, aradaki bellek gidiş gelişi olmadan hesaplayan tek bir kernel’de birleştirir.',
          summary: 'Üç kernel bire iner; bellek trafiği ortadan kalkar.',
        },
        bindings: {
          title: 'Python bindings',
          body: 'Kullanıcıya görünen API Python, ama çekirdek C++ ve CUDA. pybind11 gibi bir binding katmanı native fonksiyonları Python yorumlayıcısına açar; böylece Python’daki my_tensor_lib.add(a, b) aslında derlenmiş C++’a doğrudan bir çağrıdır.',
          summary: 'Son sıçrama: derlenmiş C++’tan, yazdığın dile geri dönüş.',
        },
      },
    },
    trace: {
      title: 'c = a + b, en dibe kadar',
      lede: 'Yukarıdaki her katman, tek bir gerçek çağrı için sırayla.',
      phases: { host: 'Host', device: 'Device', return: 'Dönüş' },
      steps: {
        python: 'Python: c = a + b',
        'tensor-api': 'Tensor.__add__() çağrıyı çözer',
        operator: 'aten::add operator’üne yönlenir',
        dispatcher: 'Dispatcher device=cuda, dtype=float32 okur',
        'cuda-backend': 'add_cuda(a, b) host üzerinde çalışır',
        allocator: 'Allocator çıktı için GPU belleği ayırır',
        'kernel-select': 'float32 add kernel’i seçilir',
        'kernel-launch': 'add_kernel<<<3907, 256>>>(...) başlatılır',
        'cuda-runtime': 'CUDA Runtime kernel’i bir stream’e kuyruğa alır',
        'cuda-driver': 'Sürücü bunu GPU komutlarına çevirir',
        'gpu-scheduler': 'Zamanlayıcı block’ları SM’lere dağıtır',
        warps: 'Her SM thread’lerini 32’lik warp’larla çalıştırır',
        'gpu-memory': 'out[i] = a[i] + b[i] paralel olarak gerçekleşir',
        return: 'Sonuç bir Tensor olarak döner — requires_grad açıksa bir grad_fn’le birlikte',
      },
      closing:
        'PyTorch benzeri bir framework bir CUDA kütüphanesi değil. CUDA’yı birkaç backend’den biri olarak kullanan bir tensor runtime’ı, operator sistemi ve autodiff motoru.',
    },
    footer: {
      back: 'emrecanulu.com’a dön',
    },
  },
};
