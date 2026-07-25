Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :judgements, only: [ :create ]
    resources :feedbacks, only: [ :create ]
  end

  namespace :admin do
    get "masters/:master_type", to: "masters#index"
    post "masters/:master_type", to: "masters#create"
    patch "masters/:master_type/:id", to: "masters#update"
    delete "masters/:master_type/:id", to: "masters#destroy"
    post "quota_resets", to: "quota_resets#create"
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
